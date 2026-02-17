// ============================================
// Blog Scheduler — Random Daily Publishing
// ============================================
//
// Orchestrates the full daily blog lifecycle:
//   1. At generation time (default 2 AM), generates N blog posts
//   2. Assigns each post a random publish time within the day's window
//   3. Hourly publish check picks up due posts and publishes them
//
// Features:
//   - Configurable posts-per-day, time window, and minimum spacing
//   - Weekend skipping (optional)
//   - Timezone-aware scheduling
//   - Graceful shutdown with in-flight job draining
//   - HTTP health check endpoint
//   - Full error recovery with retry on individual post failures
// ============================================

import http from 'http';
import cron, { ScheduledTask } from 'node-cron';
import { config } from '../config/env';
import { createServiceLogger } from '../config/logger';
import { ContentGenerator } from '../services/contentGenerator';
import {
  researchTopic,
  getNextPendingTopic,
  markTopicUsed,
} from '../services/research.service';
import {
  saveDraft,
  publishPost,
  schedulePost,
  getPostsReadyToPublish,
} from '../services/posting.service';
import prisma from '../database/client';
import { SchedulerConfig, HealthStatus, StatusDashboard } from '../types';
import { sleep } from '../utils/helpers';

const logger = createServiceLogger('blog-scheduler');

// ── BlogScheduler Class ─────────────────────────────────────────────

export class BlogScheduler {
  private readonly cfg: SchedulerConfig;
  private readonly contentGenerator: ContentGenerator;
  private cronJobs: ScheduledTask[] = [];
  private healthServer: http.Server | null = null;
  private isShuttingDown = false;
  private activeJobs = 0;
  private postsGeneratedToday = 0;
  private postsPublishedToday = 0;
  private startedAt: Date;

  constructor(overrides?: Partial<SchedulerConfig>) {
    this.cfg = { ...config.scheduling, ...overrides };
    this.contentGenerator = new ContentGenerator();
    this.startedAt = new Date();

    // Validate config at construction time
    this.validateConfig();

    logger.info('BlogScheduler created', {
      postsPerDay: this.cfg.postsPerDay,
      window: `${this.cfg.windowStartHour}:00 – ${this.cfg.windowEndHour}:00`,
      timezone: this.cfg.timezone,
      skipWeekends: this.cfg.skipWeekends,
      minSpacingHours: this.cfg.minSpacingHours,
      generationCron: this.cfg.generationCron,
      publishCheckCron: this.cfg.publishCheckCron,
    });
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Starts all cron jobs and the health-check HTTP server.
   */
  start(): void {
    if (this.cronJobs.length > 0) {
      logger.warn('Scheduler already started — ignoring duplicate start()');
      return;
    }

    // Reset daily counters at midnight (server local time)
    const midnightJob = cron.schedule('0 0 * * *', () => {
      this.postsGeneratedToday = 0;
      this.postsPublishedToday = 0;
      logger.info('Daily counters reset');
    });
    this.cronJobs.push(midnightJob);

    // Daily content generation (default: 2 AM)
    if (!cron.validate(this.cfg.generationCron)) {
      throw new Error(`Invalid generation cron: ${this.cfg.generationCron}`);
    }
    const generationJob = cron.schedule(this.cfg.generationCron, () => {
      this.wrapJob('daily-generation', () => this.scheduleDaily());
    });
    this.cronJobs.push(generationJob);

    // Hourly publish check (default: every hour on the hour)
    if (!cron.validate(this.cfg.publishCheckCron)) {
      throw new Error(`Invalid publish-check cron: ${this.cfg.publishCheckCron}`);
    }
    const publishJob = cron.schedule(this.cfg.publishCheckCron, () => {
      this.wrapJob('publish-check', () => this.executeScheduledPosts());
    });
    this.cronJobs.push(publishJob);

    // Start health-check HTTP server
    this.startHealthServer();

    logger.info('BlogScheduler started', {
      generation: this.cfg.generationCron,
      publishCheck: this.cfg.publishCheckCron,
      healthPort: this.cfg.healthCheckPort,
      cronJobs: this.cronJobs.length,
    });
  }

  /**
   * Gracefully stops the scheduler.
   *  1. Prevents new jobs from starting
   *  2. Waits for in-flight jobs to complete (up to 60 s)
   *  3. Stops all cron tasks
   *  4. Closes the health-check server
   */
  async stop(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info('BlogScheduler shutting down...', { activeJobs: this.activeJobs });

    // Wait for in-flight jobs to finish (max 60 seconds)
    const deadline = Date.now() + 60_000;
    while (this.activeJobs > 0 && Date.now() < deadline) {
      logger.info('Waiting for active jobs to complete', { activeJobs: this.activeJobs });
      await sleep(2_000);
    }

    if (this.activeJobs > 0) {
      logger.warn('Forcing shutdown with active jobs still running', {
        activeJobs: this.activeJobs,
      });
    }

    // Stop cron tasks
    for (const job of this.cronJobs) {
      job.stop();
    }
    this.cronJobs = [];

    // Close health-check server
    if (this.healthServer) {
      await new Promise<void>((resolve) => {
        this.healthServer!.close(() => resolve());
      });
      this.healthServer = null;
    }

    logger.info('BlogScheduler stopped');
  }

  // ── Core Scheduling Logic ─────────────────────────────────────────

  /**
   * Main daily entry point: generates N posts with research, saves
   * them as drafts, and assigns each a random publish time for today.
   */
  async scheduleDaily(): Promise<void> {
    const today = this.getNowInTimezone();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    if (this.cfg.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      logger.info('Skipping weekend — no posts will be generated today', {
        day: today.toLocaleDateString('en-US', { weekday: 'long', timeZone: this.cfg.timezone }),
      });
      return;
    }

    logger.info('Starting daily schedule', {
      postsPerDay: this.cfg.postsPerDay,
      date: today.toISOString().slice(0, 10),
    });

    await this.createDailyPosts(this.cfg.postsPerDay);
  }

  /**
   * Generates a single random Date within today's publishing window.
   * The date is returned as a UTC Date object suitable for DB storage.
   */
  async generateRandomTime(): Promise<Date> {
    const times = this.generateSpacedTimes(1);
    return times[0];
  }

  /**
   * Checks for SCHEDULED posts whose scheduledFor time has passed
   * and publishes them.
   */
  async executeScheduledPosts(): Promise<void> {
    const posts = await getPostsReadyToPublish();

    if (posts.length === 0) {
      logger.debug('No scheduled posts ready to publish');
      return;
    }

    logger.info(`Found ${posts.length} post(s) ready to publish`);

    for (const post of posts) {
      if (this.isShuttingDown) {
        logger.warn('Shutdown in progress — skipping remaining posts');
        break;
      }

      try {
        const result = await publishPost(post.id);

        if (result.success) {
          this.postsPublishedToday++;
          logger.info('Scheduled post published', {
            postId: post.id,
            title: post.title,
            url: result.url,
          });
        } else {
          logger.error('Scheduled post failed to publish', {
            postId: post.id,
            title: post.title,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error('Unexpected error publishing scheduled post', {
          postId: post.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Generates `count` blog posts via the full pipeline (research →
   * generate → save draft), then assigns each a random publish time.
   */
  async createDailyPosts(count: number): Promise<void> {
    const publishTimes = this.generateSpacedTimes(count);

    logger.info('Scheduled publish times', {
      count,
      times: publishTimes.map((t) =>
        t.toLocaleTimeString('en-US', { timeZone: this.cfg.timezone, hour: '2-digit', minute: '2-digit' }),
      ),
    });

    let generated = 0;

    for (let i = 0; i < count; i++) {
      if (this.isShuttingDown) {
        logger.warn('Shutdown in progress — stopping post generation', { generated, remaining: count - i });
        break;
      }

      try {
        const postId = await this.runSinglePipeline();

        // Schedule the post for its random time
        await schedulePost(postId, publishTimes[i]);

        generated++;
        this.postsGeneratedToday++;

        logger.info('Post generated and scheduled', {
          postId,
          position: `${i + 1}/${count}`,
          scheduledFor: publishTimes[i].toLocaleTimeString('en-US', {
            timeZone: this.cfg.timezone,
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      } catch (error) {
        logger.error('Failed to generate post — continuing with next', {
          position: `${i + 1}/${count}`,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue to next post — don't let one failure stop the batch
      }
    }

    logger.info('Daily post generation complete', {
      generated,
      target: count,
      failed: count - generated,
    });
  }

  // ── Health Check ──────────────────────────────────────────────────

  /**
   * Returns a snapshot of the scheduler's operational state.
   */
  async getHealthStatus(): Promise<HealthStatus> {
    // Count pending scheduled posts
    const pendingCount = await prisma.blogPost.count({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { gt: new Date() },
      },
    });

    return {
      running: !this.isShuttingDown,
      activeJobs: this.activeJobs,
      registeredCrons: this.cronJobs.length,
      postsGeneratedToday: this.postsGeneratedToday,
      postsPublishedToday: this.postsPublishedToday,
      postsScheduledPending: pendingCount,
      postsPerDayTarget: this.cfg.postsPerDay,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      serverTime: new Date().toISOString(),
      timezone: this.cfg.timezone,
    };
  }

  // ── Private: Pipeline ─────────────────────────────────────────────

  /**
   * Runs the full pipeline for a single blog post:
   * topic (via TopicManager) → research → generate → save draft.
   * Returns the saved post's database ID.
   */
  private async runSinglePipeline(): Promise<string> {
    // 1. Get next topic (TopicManager handles rotation + auto-refresh)
    const topic = await getNextPendingTopic();
    if (!topic) {
      throw new Error('No pending topics in the queue — TopicManager could not supply one');
    }

    logger.info('Pipeline: processing topic', {
      topicId: topic.id,
      topic: topic.topic,
      category: topic.category,
      priority: topic.priority,
    });

    // 2. Research
    const researchResult = await researchTopic(topic.id);

    // 3. Generate blog content
    const blogContent = await this.contentGenerator.generateBlogPost(
      researchResult,
      topic.topic,
    );

    // 4. Save draft
    const postId = await saveDraft(blogContent);

    // 5. Mark topic as used (also advances category rotation)
    await markTopicUsed(topic.id);

    logger.info('Pipeline: post saved as draft', {
      postId,
      topicId: topic.id,
      title: blogContent.title,
      wordCount: blogContent.wordCount,
    });

    return postId;
  }

  // ── Private: Time Generation ──────────────────────────────────────

  /**
   * Generates `count` random publish times for today that:
   *   - Fall within [windowStartHour, windowEndHour) in the configured timezone
   *   - Are at least `minSpacingHours` apart from each other
   *   - Are sorted chronologically
   *
   * Algorithm:
   *   1. Compute total window in minutes
   *   2. Subtract total spacing overhead → usable minutes
   *   3. Distribute usable minutes evenly as "slots"
   *   4. For each slot, pick a random offset and add the cumulative spacing
   *
   * If the window is too small for the requested count with spacing,
   * it falls back to evenly dividing the window.
   */
  private generateSpacedTimes(count: number): Date[] {
    const now = new Date();

    // Build "today at windowStartHour" in the target timezone
    const baseDate = this.getTodayAtHourInTimezone(this.cfg.windowStartHour);
    const endDate = this.getTodayAtHourInTimezone(this.cfg.windowEndHour);

    const windowMinutes = (endDate.getTime() - baseDate.getTime()) / 60_000;
    const spacingMinutes = this.cfg.minSpacingHours * 60;
    const totalSpacing = spacingMinutes * Math.max(count - 1, 0);

    const times: Date[] = [];

    if (windowMinutes <= 0 || count <= 0) {
      return times;
    }

    if (totalSpacing >= windowMinutes) {
      // Window too small for spacing — fall back to even distribution
      logger.warn('Window too small for requested spacing — distributing evenly', {
        windowMinutes,
        totalSpacing,
        count,
      });

      const step = windowMinutes / (count + 1);
      for (let i = 1; i <= count; i++) {
        const offsetMs = step * i * 60_000;
        const t = new Date(baseDate.getTime() + offsetMs);
        // Don't schedule in the past
        times.push(t > now ? t : new Date(now.getTime() + i * 60_000));
      }

      return times;
    }

    // Usable minutes after reserving spacing gaps
    const usableMinutes = windowMinutes - totalSpacing;
    const slotSize = usableMinutes / count;

    let cursor = 0; // cumulative offset in minutes from baseDate

    for (let i = 0; i < count; i++) {
      // Random position within this slot
      const randomOffset = Math.random() * slotSize;
      cursor += randomOffset;

      const totalOffsetMs = cursor * 60_000;
      const t = new Date(baseDate.getTime() + totalOffsetMs);

      // Don't schedule in the past
      times.push(t > now ? t : new Date(now.getTime() + (i + 1) * 60_000));

      // Move cursor past the remaining slot + spacing gap
      cursor += (slotSize - randomOffset) + spacingMinutes;
    }

    return times;
  }

  // ── Private: Timezone Helpers ─────────────────────────────────────

  /**
   * Returns the current date/time as perceived in the configured timezone.
   * Note: the returned Date is still a UTC-based JS Date, but its
   * components have been shifted to match the target timezone.
   */
  private getNowInTimezone(): Date {
    const nowStr = new Date().toLocaleString('en-US', { timeZone: this.cfg.timezone });
    return new Date(nowStr);
  }

  /**
   * Returns a UTC Date object representing "today at `hour`:00" in
   * the configured timezone.
   *
   * Approach: format today's date in the target TZ to get Y/M/D,
   * then construct a Date string with the desired hour and re-parse.
   */
  private getTodayAtHourInTimezone(hour: number): Date {
    const now = new Date();

    // Get today's date parts in the target timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.cfg.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // Returns "YYYY-MM-DD"

    // Build an ISO-like string and parse it.
    // We use Intl to figure out the TZ offset and adjust manually.
    const targetLocal = new Date(`${parts}T${String(hour).padStart(2, '0')}:00:00`);

    // Calculate offset: difference between UTC and target timezone
    const utcMs = now.getTime();
    const tzMs = new Date(now.toLocaleString('en-US', { timeZone: this.cfg.timezone })).getTime();
    const offsetMs = utcMs - tzMs;

    return new Date(targetLocal.getTime() + offsetMs);
  }

  // ── Private: Job Wrapper ──────────────────────────────────────────

  /**
   * Wraps a job handler with:
   *  - Shutdown guard
   *  - Active job counter (for graceful shutdown)
   *  - Error logging
   */
  private wrapJob(name: string, fn: () => Promise<void>): void {
    if (this.isShuttingDown) {
      logger.info(`Skipping job "${name}" — shutdown in progress`);
      return;
    }

    this.activeJobs++;
    logger.info(`Job "${name}" started`, { activeJobs: this.activeJobs });

    fn()
      .catch((error) => {
        logger.error(`Job "${name}" failed`, {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        this.activeJobs--;
        logger.info(`Job "${name}" finished`, { activeJobs: this.activeJobs });
      });
  }

  // ── Status Dashboard ────────────────────────────────────────────

  /**
   * Returns a rich status dashboard with database metrics,
   * queue state, and recent error information.
   */
  async getStatusDashboard(): Promise<StatusDashboard> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // All queries in parallel for speed
    const [
      dbLatency,
      publishedToday,
      failedToday,
      scheduledPending,
      nextScheduled,
      unusedTotal,
      jsCnt, tsCnt, feCnt,
      lastError,
    ] = await Promise.all([
      this.measureDbLatency(),
      prisma.blogPost.count({ where: { status: 'PUBLISHED', publishedAt: { gte: todayStart } } }),
      prisma.blogPost.count({ where: { status: 'FAILED', updatedAt: { gte: todayStart } } }),
      prisma.blogPost.count({ where: { status: 'SCHEDULED', scheduledFor: { gt: now } } }),
      prisma.blogPost.findFirst({ where: { status: 'SCHEDULED', scheduledFor: { gt: now } }, orderBy: { scheduledFor: 'asc' }, select: { scheduledFor: true } }),
      prisma.topicQueue.count({ where: { used: false } }),
      prisma.topicQueue.count({ where: { used: false, category: 'JAVASCRIPT' } }),
      prisma.topicQueue.count({ where: { used: false, category: 'TYPESCRIPT' } }),
      prisma.topicQueue.count({ where: { used: false, category: 'FRONTEND' } }),
      prisma.publishLog.findFirst({ where: { success: false }, orderBy: { attemptedAt: 'desc' }, select: { errorMessage: true, postId: true, attemptedAt: true } }),
    ]);

    const dbConnected = dbLatency >= 0;
    const queueLow = unusedTotal < 10;

    let overallStatus: StatusDashboard['status'] = 'healthy';
    if (!dbConnected) overallStatus = 'error';
    else if (queueLow || failedToday > 0) overallStatus = 'degraded';

    return {
      status: overallStatus,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      serverTime: now.toISOString(),
      timezone: this.cfg.timezone,
      database: {
        connected: dbConnected,
        latencyMs: Math.max(dbLatency, 0),
      },
      today: {
        postsGenerated: this.postsGeneratedToday,
        postsPublished: publishedToday,
        postsFailed: failedToday,
      },
      scheduled: {
        pending: scheduledPending,
        nextPublishAt: nextScheduled?.scheduledFor?.toISOString() ?? null,
      },
      topicQueue: {
        unusedTotal,
        unusedByCategory: {
          JAVASCRIPT: jsCnt,
          TYPESCRIPT: tsCnt,
          FRONTEND: feCnt,
        },
        needsRefresh: queueLow,
      },
      lastError: {
        message: lastError?.errorMessage ?? null,
        postId: lastError?.postId ?? null,
        occurredAt: lastError?.attemptedAt?.toISOString() ?? null,
      },
      scheduler: {
        running: !this.isShuttingDown,
        activeJobs: this.activeJobs,
        registeredCrons: this.cronJobs.length,
        postsPerDayTarget: this.cfg.postsPerDay,
      },
    };
  }

  // ── Private: Health-Check & Status Server ─────────────────────────

  /**
   * Starts a minimal HTTP server with:
   *   GET /health  — lightweight health check (HealthStatus)
   *   GET /status  — rich status dashboard (StatusDashboard)
   */
  private startHealthServer(): void {
    this.healthServer = http.createServer(async (req, res) => {
      const sendJson = (code: number, data: unknown) => {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
      };

      try {
        if (req.method === 'GET' && req.url === '/health') {
          const status = await this.getHealthStatus();
          sendJson(200, status);
        } else if (req.method === 'GET' && req.url === '/status') {
          const dashboard = await this.getStatusDashboard();
          sendJson(200, dashboard);
        } else {
          sendJson(404, { error: 'Not found. Available: GET /health, GET /status' });
        }
      } catch (error) {
        logger.error('HTTP handler error', { url: req.url, error: error instanceof Error ? error.message : String(error) });
        sendJson(500, { error: 'Internal server error' });
      }
    });

    this.healthServer.listen(this.cfg.healthCheckPort, () => {
      logger.info('Health/status server listening', { port: this.cfg.healthCheckPort });
    });

    this.healthServer.on('error', (err) => {
      logger.error('Health/status server error', { error: err.message });
    });
  }

  /**
   * Measures database round-trip latency. Returns -1 if unreachable.
   */
  private async measureDbLatency(): Promise<number> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  // ── Private: Config Validation ────────────────────────────────────

  /**
   * Validates the scheduler configuration at construction time.
   */
  private validateConfig(): void {
    const { windowStartHour, windowEndHour, postsPerDay, minSpacingHours } = this.cfg;

    if (windowStartHour < 0 || windowStartHour > 23) {
      throw new Error(`windowStartHour must be 0-23, got ${windowStartHour}`);
    }
    if (windowEndHour < 0 || windowEndHour > 23) {
      throw new Error(`windowEndHour must be 0-23, got ${windowEndHour}`);
    }
    if (windowEndHour <= windowStartHour) {
      throw new Error(`windowEndHour (${windowEndHour}) must be greater than windowStartHour (${windowStartHour})`);
    }
    if (postsPerDay < 1 || postsPerDay > 10) {
      throw new Error(`postsPerDay must be 1-10, got ${postsPerDay}`);
    }
    if (minSpacingHours < 0) {
      throw new Error(`minSpacingHours must be >= 0, got ${minSpacingHours}`);
    }

    const windowHours = windowEndHour - windowStartHour;
    const requiredHours = minSpacingHours * (postsPerDay - 1);
    if (requiredHours > windowHours) {
      logger.warn(
        'Spacing config exceeds window — posts will be distributed evenly instead',
        { windowHours, requiredHours, postsPerDay, minSpacingHours },
      );
    }
  }
}

export default BlogScheduler;
