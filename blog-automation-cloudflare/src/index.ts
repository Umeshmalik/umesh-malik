// ============================================
// Blog Automation — Cloudflare Worker Entry Point
// ============================================
//
// Unified Worker handling three event types:
//   1. Cron Triggers → Content generation & publish checks
//   2. Queue Consumer → Process publish jobs
//   3. HTTP Fetch → API routes for management & health
//
// ============================================

import type { Env, PublishMessage, BlogRow, PostCategory } from './types/env';
import * as topicManager from './services/topic-manager';
import { researchTopic } from './services/research';
import { generateBlogPost } from './services/content-generator';
import { publishPost, publishDueBlogs, validateConnection } from './services/publisher';
import * as db from './db/queries';
import * as cache from './services/kv-cache';
import { log, randomInt, toUnixSeconds } from './utils/helpers';

// ── Worker Export ───────────────────────────────────────────────────

export default {
  // ── Cron Triggers ───────────────────────────────────────────────
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const cronPattern = controller.cron;
    log('info', 'Cron triggered', { cron: cronPattern });

    try {
      if (cronPattern === '*/15 * * * *') {
        // Publish check — runs every 15 minutes
        ctx.waitUntil(handlePublishCheck(env));
      } else {
        // Content generation — runs at 9 AM and 6 PM UTC
        ctx.waitUntil(handleContentGeneration(env));
      }
    } catch (error) {
      log('error', 'Cron handler failed', { cron: cronPattern, error: String(error) });
      await notifyError(env, `Cron failed: ${cronPattern}`, String(error));
    }
  },

  // ── Queue Consumer ──────────────────────────────────────────────
  async queue(
    batch: MessageBatch<PublishMessage>,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    log('info', 'Processing publish queue', { messageCount: batch.messages.length });

    for (const message of batch.messages) {
      try {
        const { blogId, scheduledTime } = message.body;
        const now = Date.now();

        // Not yet time — retry later (cap at 12h max per Cloudflare Queues limit)
        if (scheduledTime && now < scheduledTime) {
          const delaySec = Math.floor((scheduledTime - now) / 1000);
          const cappedDelay = Math.min(Math.max(60, delaySec), 43200); // 43200s = 12h max
          log('info', 'Blog not yet due, retrying later', { blogId, delaySec: cappedDelay });
          message.retry({ delaySeconds: cappedDelay });
          continue;
        }

        // Fetch the blog
        const blog = await db.getBlogById(env.DB, blogId);
        if (!blog || blog.status === 'published') {
          message.ack();
          continue;
        }

        // Publish
        const result = await publishPost(env, blog);
        if (result.success) {
          message.ack();
        } else {
          // Use built-in message.attempts (starts at 1) for retry backoff
          if (message.attempts < 4) {
            const backoffDelay = Math.min(300 * Math.pow(2, message.attempts - 1), 43200);
            message.retry({ delaySeconds: backoffDelay });
          } else {
            log('error', 'Max publish retries exceeded', { blogId, attempts: message.attempts });
            message.ack(); // Falls through to DLQ
          }
        }
      } catch (error) {
        log('error', 'Queue message processing failed', { error: String(error) });
        message.retry();
      }
    }
  },

  // ── HTTP Routes ─────────────────────────────────────────────────
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Health check
      if (path === '/health') {
        return json({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // Status dashboard
      if (path === '/status') {
        return json(await getStatusDashboard(env));
      }

      // List recent blogs
      if (path === '/api/blogs' && method === 'GET') {
        const blogs = await db.getRecentBlogs(env.DB, 20);
        return json({ blogs });
      }

      // Get single blog
      if (path.startsWith('/api/blogs/') && method === 'GET') {
        const id = parseInt(path.split('/').pop() || '');
        if (isNaN(id)) return json({ error: 'Invalid blog ID' }, 400);
        const blog = await db.getBlogById(env.DB, id);
        if (!blog) return json({ error: 'Blog not found' }, 404);
        return json({ blog });
      }

      // Trigger content generation manually
      if (path === '/api/generate' && method === 'POST') {
        ctx.waitUntil(handleContentGeneration(env));
        return json({ message: 'Content generation started' }, 202);
      }

      // Trigger publish check manually
      if (path === '/api/publish' && method === 'POST') {
        const result = await publishDueBlogs(env);
        return json({ message: 'Publish check complete', ...result });
      }

      // Topic queue stats
      if (path === '/api/topics/stats' && method === 'GET') {
        const stats = await db.getTopicQueueStats(env.DB);
        return json(stats);
      }

      // Generate new topics
      if (path === '/api/topics/generate' && method === 'POST') {
        const body = await request.json() as { count?: number };
        const result = await topicManager.generateTopicIdeas(env, body.count || 20);
        return json(result);
      }

      // Add manual topics
      if (path === '/api/topics' && method === 'POST') {
        const body = await request.json() as { topics: string[]; category: PostCategory; priority?: number };
        const result = await topicManager.addManualTopics(env, body.topics, body.category, body.priority);
        return json(result);
      }

      // Validate CMS connection
      if (path === '/api/validate-connection' && method === 'GET') {
        const isValid = await validateConnection(env);
        return json({ connected: isValid });
      }

      // Cache stats
      if (path === '/api/cache/stats' && method === 'GET') {
        const stats = await cache.getCacheStats(env);
        return json(stats);
      }

      // 404
      return json({ error: 'Not found', path }, 404);
    } catch (error) {
      log('error', 'HTTP handler error', { path, error: String(error) });
      return json({ error: 'Internal server error' }, 500);
    }
  },
};

// ── Content Generation Pipeline ────────────────────────────────────

async function handleContentGeneration(env: Env): Promise<void> {
  const todayStats = await db.getTodayStats(env.DB);
  const postsPerDay = parseInt(env.POSTS_PER_DAY || '2');

  if (todayStats.generated >= postsPerDay) {
    log('info', 'Daily post quota reached', { generated: todayStats.generated, target: postsPerDay });
    return;
  }

  const remaining = postsPerDay - todayStats.generated;
  log('info', 'Generating content', { remaining, postsPerDay });

  for (let i = 0; i < remaining; i++) {
    try {
      // 1. Pick a topic
      const { id: topicId, topic, category } = await topicManager.getNextTopic(env);

      // 2. Research the topic
      const research = await researchTopic(env, topic, category);

      // 3. Generate content
      const content = await generateBlogPost(env, topic, category, research);

      // 4. Calculate scheduled time
      const scheduledFor = calculateScheduledTime(env, i);

      // 5. Store in D1
      const blogId = await db.createBlog(env.DB, content, category, research, scheduledFor);

      // 6. Mark topic as used
      await db.markTopicUsed(env.DB, topicId);

      // 7. Queue for publishing
      await env.PUBLISH_QUEUE.send({
        blogId,
        scheduledTime: scheduledFor * 1000, // Convert to ms
      });

      // 8. Cache the content
      await cache.cacheContent(env, blogId, content);

      log('info', 'Content generated and queued', {
        blogId,
        topic,
        category,
        scheduledFor: new Date(scheduledFor * 1000).toISOString(),
      });
    } catch (error) {
      log('error', 'Content generation iteration failed', { iteration: i, error: String(error) });
      await notifyError(env, 'Content generation failed', String(error));
    }
  }
}

// ── Publish Check ──────────────────────────────────────────────────

async function handlePublishCheck(env: Env): Promise<void> {
  const result = await publishDueBlogs(env);
  if (result.published > 0 || result.failed > 0) {
    log('info', 'Publish check results', result);
  }
}

// ── Scheduling Logic ───────────────────────────────────────────────

function calculateScheduledTime(env: Env, index: number): number {
  const windowStart = parseInt(env.SCHEDULE_WINDOW_START || '9');
  const windowEnd = parseInt(env.SCHEDULE_WINDOW_END || '21');
  const spacing = parseInt(env.MIN_POST_SPACING_HOURS || '4');

  const now = new Date();
  const baseHour = windowStart + (index * spacing);
  const hour = Math.min(baseHour + randomInt(0, 1), windowEnd - 1);
  const minute = randomInt(0, 59);

  now.setUTCHours(hour, minute, 0, 0);

  // If in the past, schedule for tomorrow
  if (now.getTime() < Date.now()) {
    now.setDate(now.getDate() + 1);
  }

  return toUnixSeconds(now);
}

// ── Status Dashboard ───────────────────────────────────────────────

async function getStatusDashboard(env: Env) {
  const [todayStats, topicStats, dueBlogs] = await Promise.all([
    db.getTodayStats(env.DB),
    db.getTopicQueueStats(env.DB),
    db.getDueBlogs(env.DB),
  ]);

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    today: todayStats,
    topicQueue: {
      unused: topicStats.unused,
      total: topicStats.total,
      byCategory: topicStats.byCategory,
      needsRefresh: topicStats.unused < 10,
    },
    scheduled: {
      pending: dueBlogs.length,
    },
    config: {
      postsPerDay: parseInt(env.POSTS_PER_DAY || '2'),
      websiteType: env.WEBSITE_TYPE || 'custom',
      dryRun: env.DRY_RUN === 'true',
      timezone: env.SCHEDULE_TIMEZONE || 'UTC',
    },
  };
}

// ── Notifications ──────────────────────────────────────────────────

async function notifyError(env: Env, title: string, message: string): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) return;

  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔴 *Blog Automation Error*\n*${title}*\n${message}`,
      }),
    });
  } catch {
    log('error', 'Failed to send Slack notification');
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function json(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
