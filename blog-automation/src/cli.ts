#!/usr/bin/env node
// ============================================
// Blog Automation System — CLI Interface
// ============================================
//
// Provides individual commands for operating the blog automation
// system outside of the scheduler daemon.
//
// Usage:
//   npx ts-node src/cli.ts <command> [options]
//
// Or via npm scripts defined in package.json:
//   npm run cli -- generate
//   npm run cli -- publish <postId>
//   npm run cli -- schedule
//   npm run cli -- topics:add "My Topic" --category TYPESCRIPT
//   npm run cli -- topics:generate 20
//   npm run cli -- test-connection
//   npm run cli -- status
// ============================================

import { Command } from 'commander';
import { config } from './config/env';
import { createServiceLogger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './database/client';
import prisma from './database/client';
import { ContentGenerator } from './services/contentGenerator';
import {
  researchTopic,
  getNextPendingTopic,
  markTopicUsed,
  getTopicManager,
} from './services/research.service';
import {
  saveDraft,
  publishPost,
  getRecentPublishedPosts,
  getPublishService,
} from './services/posting.service';
import { TopicCategory, ALL_CATEGORIES } from './types';

const cliLogger = createServiceLogger('cli');
const VERSION = '1.0.0';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Wraps a CLI command handler with DB connection setup/teardown
 * and standard error handling with exit codes.
 */
function withDatabase(
  fn: () => Promise<void>,
): () => Promise<void> {
  return async () => {
    try {
      await connectDatabase();
      await fn();
      await disconnectDatabase();
      process.exit(0);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      cliLogger.error('Command failed', { error: msg });
      console.error(`\n  Error: ${msg}\n`);
      try { await disconnectDatabase(); } catch { /* ignore */ }
      process.exit(1);
    }
  };
}

/**
 * Validates that a category string is one of the allowed values.
 */
function validateCategory(value: string): TopicCategory {
  const upper = value.toUpperCase() as TopicCategory;
  if (!ALL_CATEGORIES.includes(upper)) {
    throw new Error(
      `Invalid category "${value}". Must be one of: ${ALL_CATEGORIES.join(', ')}`,
    );
  }
  return upper;
}

/**
 * Formats a Date for human-readable CLI output.
 */
function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: config.scheduling.timezone,
  });
}

/** Horizontal rule for CLI output */
const HR = '─'.repeat(60);

// ── Program ─────────────────────────────────────────────────────────

const program = new Command();

program
  .name('blog-auto')
  .description('Blog Automation System — CLI')
  .version(VERSION);

// ── generate ────────────────────────────────────────────────────────

program
  .command('generate')
  .description('Generate one blog post now (research → generate → save draft)')
  .option('--publish', 'Immediately publish after generating', false)
  .action(withDatabase(async () => {
    const opts = program.commands.find((c) => c.name() === 'generate')!.opts();

    console.log(`\n  Generating a new blog post...\n`);

    // 1. Get next topic
    const topic = await getNextPendingTopic();
    if (!topic) {
      throw new Error('No unused topics in the queue. Run "topics:generate" first.');
    }

    console.log(`  Topic:    ${topic.topic}`);
    console.log(`  Category: ${topic.category}`);
    console.log(`  ${HR}`);

    // 2. Research
    console.log('  Researching topic...');
    const researchResult = await researchTopic(topic.id);
    console.log(`  Found ${researchResult.sources.length} sources, ${researchResult.mainInsights.length} insights`);

    // 3. Generate content
    console.log('  Generating blog post with Claude...');
    const generator = new ContentGenerator();
    const blogContent = await generator.generateBlogPost(researchResult, topic.topic);

    console.log(`  Title:      ${blogContent.title}`);
    console.log(`  Words:      ${blogContent.wordCount}`);
    console.log(`  Code blocks: ${blogContent.codeBlockCount}`);
    console.log(`  Sections:   ${blogContent.sections.length}`);

    // 4. Save draft
    const postId = await saveDraft(blogContent);
    await markTopicUsed(topic.id);

    console.log(`  ${HR}`);
    console.log(`  Draft saved: ${postId}`);

    // 5. Optionally publish
    if (opts.publish) {
      console.log('  Publishing...');
      const result = await publishPost(postId);
      if (result.success) {
        console.log(`  Published: ${result.url ?? 'OK'}`);
      } else {
        console.log(`  Publish failed: ${result.error}`);
      }
    }

    console.log('');
  }));

// ── publish ─────────────────────────────────────────────────────────

program
  .command('publish <postId>')
  .description('Publish a specific blog post by its database ID')
  .option('--draft', 'Publish as draft on the CMS', false)
  .action(withDatabase(async () => {
    const cmd = program.commands.find((c) => c.name() === 'publish')!;
    const postId = cmd.args[0];
    const opts = cmd.opts();

    console.log(`\n  Publishing post ${postId}...\n`);

    const result = await publishPost(postId, opts.draft);

    if (result.success) {
      console.log(`  Status:  Published`);
      console.log(`  URL:     ${result.url ?? '—'}`);
      console.log(`  CMS ID:  ${result.postId ?? '—'}`);
      console.log(`  Adapter: ${result.adapter}`);
      console.log(`  Took:    ${result.durationMs}ms`);
      if (result.dryRun) console.log(`  (dry-run — no actual changes made)`);
    } else {
      console.log(`  Status:  FAILED`);
      console.log(`  Error:   ${result.error}`);
      console.log(`  Adapter: ${result.adapter}`);
    }

    console.log('');
  }));

// ── schedule ────────────────────────────────────────────────────────

program
  .command('schedule')
  .description('View all scheduled (pending) posts')
  .action(withDatabase(async () => {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'SCHEDULED' },
      orderBy: { scheduledFor: 'asc' },
      select: { id: true, title: true, category: true, scheduledFor: true, createdAt: true },
    });

    console.log(`\n  Scheduled Posts (${posts.length})\n  ${HR}`);

    if (posts.length === 0) {
      console.log('  No posts currently scheduled.\n');
      return;
    }

    for (const post of posts) {
      const due = post.scheduledFor && post.scheduledFor <= new Date() ? ' [DUE]' : '';
      console.log(`  ${post.id.slice(0, 8)}  ${post.category.padEnd(12)} ${fmtDate(post.scheduledFor)}${due}`);
      console.log(`           ${post.title}`);
    }

    console.log('');
  }));

// ── topics:add ──────────────────────────────────────────────────────

program
  .command('topics:add <topic>')
  .description('Add a topic to the queue')
  .requiredOption('-c, --category <category>', 'Topic category (JAVASCRIPT, TYPESCRIPT, FRONTEND)')
  .option('-p, --priority <number>', 'Priority (higher = picked sooner)', '0')
  .action(withDatabase(async () => {
    const cmd = program.commands.find((c) => c.name() === 'topics:add')!;
    const topicText = cmd.args[0];
    const opts = cmd.opts();

    const category = validateCategory(opts.category);
    const priority = parseInt(opts.priority, 10);

    console.log(`\n  Adding topic...\n`);

    const topicManager = getTopicManager();
    await topicManager.addTopics([topicText], category, priority);

    console.log(`  Topic:    "${topicText}"`);
    console.log(`  Category: ${category}`);
    console.log(`  Priority: ${priority}`);
    console.log(`  Added successfully.\n`);
  }));

// ── topics:generate ─────────────────────────────────────────────────

program
  .command('topics:generate')
  .description('Generate AI-powered topic ideas and add them to the queue')
  .argument('[count]', 'Number of topics to generate', '20')
  .action(withDatabase(async () => {
    const cmd = program.commands.find((c) => c.name() === 'topics:generate')!;
    const count = parseInt(cmd.args[0] || '20', 10);

    console.log(`\n  Generating ${count} topic ideas with Claude...\n`);

    const topicManager = getTopicManager();
    const result = await topicManager.generateTopicIdeas(count);

    console.log(`  Candidates from Claude: ${result.candidateCount}`);
    console.log(`  Added to queue:         ${result.added.length}`);
    console.log(`  Rejected (dupes/invalid): ${result.rejected.length}`);
    console.log('');
    console.log(`  Category breakdown:`);
    for (const cat of ALL_CATEGORIES) {
      console.log(`    ${cat.padEnd(12)} ${result.categoryBreakdown[cat]}`);
    }

    if (result.added.length > 0) {
      console.log(`\n  Added topics:\n  ${HR}`);
      for (const t of result.added) {
        console.log(`  [${t.category.padEnd(12)}] ${t.topic}`);
      }
    }

    if (result.rejected.length > 0) {
      console.log(`\n  Rejected topics:\n  ${HR}`);
      for (const r of result.rejected) {
        console.log(`  ✗ ${r.topic}`);
        console.log(`    ${r.reason}`);
      }
    }

    console.log('');
  }));

// ── test-connection ─────────────────────────────────────────────────

program
  .command('test-connection')
  .description('Test connectivity to the CMS and database')
  .action(withDatabase(async () => {
    console.log(`\n  Testing connections...\n  ${HR}`);

    // Database
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbMs = Date.now() - dbStart;
      console.log(`  Database:  OK (${dbMs}ms)`);
    } catch (error) {
      console.log(`  Database:  FAILED — ${error instanceof Error ? error.message : String(error)}`);
    }

    // CMS
    const cmsStart = Date.now();
    try {
      const publishService = getPublishService();
      const ok = await publishService.validateConnection();
      const cmsMs = Date.now() - cmsStart;
      console.log(`  CMS (${config.website.type}): ${ok ? 'OK' : 'FAILED'} (${cmsMs}ms)`);
      console.log(`  Endpoint:  ${config.website.apiUrl}`);
      if (config.website.dryRun) console.log(`  Mode:      dry-run`);
    } catch (error) {
      console.log(`  CMS:       FAILED — ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');
  }));

// ── status ──────────────────────────────────────────────────────────

program
  .command('status')
  .description('Show system status (database, queue, recent posts)')
  .action(withDatabase(async () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Gather all stats in parallel
    const [
      totalPosts,
      publishedToday,
      scheduledPosts,
      failedToday,
      draftPosts,
      unusedTopics,
      usedTopics,
      recentPosts,
      lastError,
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'PUBLISHED', publishedAt: { gte: todayStart } } }),
      prisma.blogPost.count({ where: { status: 'SCHEDULED' } }),
      prisma.blogPost.count({ where: { status: 'FAILED', updatedAt: { gte: todayStart } } }),
      prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      prisma.topicQueue.count({ where: { used: false } }),
      prisma.topicQueue.count({ where: { used: true } }),
      getRecentPublishedPosts(5),
      prisma.publishLog.findFirst({ where: { success: false }, orderBy: { attemptedAt: 'desc' } }),
    ]);

    // Category breakdown of unused topics
    const [jsCnt, tsCnt, feCnt] = await Promise.all([
      prisma.topicQueue.count({ where: { used: false, category: 'JAVASCRIPT' } }),
      prisma.topicQueue.count({ where: { used: false, category: 'TYPESCRIPT' } }),
      prisma.topicQueue.count({ where: { used: false, category: 'FRONTEND' } }),
    ]);

    console.log(`\n  Blog Automation — System Status`);
    console.log(`  ${HR}`);
    console.log(`  Time:       ${fmtDate(now)} (${config.scheduling.timezone})`);
    console.log(`  Env:        ${config.nodeEnv}`);
    console.log(`  CMS:        ${config.website.type}${config.website.dryRun ? ' (dry-run)' : ''}`);
    console.log('');

    // Blog posts
    console.log(`  Blog Posts`);
    console.log(`  ${HR}`);
    console.log(`  Total:      ${totalPosts}`);
    console.log(`  Published today: ${publishedToday}`);
    console.log(`  Scheduled:  ${scheduledPosts}`);
    console.log(`  Drafts:     ${draftPosts}`);
    console.log(`  Failed today: ${failedToday}`);
    console.log('');

    // Topic queue
    console.log(`  Topic Queue`);
    console.log(`  ${HR}`);
    console.log(`  Unused:     ${unusedTopics} (used: ${usedTopics})`);
    console.log(`    JAVASCRIPT:  ${jsCnt}`);
    console.log(`    TYPESCRIPT:  ${tsCnt}`);
    console.log(`    FRONTEND:    ${feCnt}`);
    if (unusedTopics < 10) {
      console.log(`  ⚠ Queue is low — run "topics:generate" to add more`);
    }
    console.log('');

    // Scheduler config
    console.log(`  Schedule`);
    console.log(`  ${HR}`);
    console.log(`  Posts/day:  ${config.scheduling.postsPerDay}`);
    console.log(`  Window:     ${config.scheduling.windowStartHour}:00 – ${config.scheduling.windowEndHour}:00`);
    console.log(`  Gen cron:   ${config.scheduling.generationCron}`);
    console.log(`  Pub check:  ${config.scheduling.publishCheckCron}`);
    console.log('');

    // Recent posts
    if (recentPosts.length > 0) {
      console.log(`  Recent Published Posts`);
      console.log(`  ${HR}`);
      for (const post of recentPosts) {
        console.log(`  ${fmtDate(post.publishedAt)}  ${post.title}`);
      }
      console.log('');
    }

    // Last error
    if (lastError) {
      console.log(`  Last Publish Error`);
      console.log(`  ${HR}`);
      console.log(`  Post:    ${lastError.postId}`);
      console.log(`  When:    ${fmtDate(lastError.attemptedAt)}`);
      console.log(`  Message: ${lastError.errorMessage ?? '(none)'}`);
      console.log('');
    }
  }));

// ── list (bonus: list recent posts) ─────────────────────────────────

program
  .command('list')
  .description('List recent blog posts')
  .option('-n, --limit <number>', 'Number of posts to show', '10')
  .option('-s, --status <status>', 'Filter by status (DRAFT, SCHEDULED, PUBLISHED, FAILED)')
  .action(withDatabase(async () => {
    const cmd = program.commands.find((c) => c.name() === 'list')!;
    const opts = cmd.opts();
    const limit = parseInt(opts.limit, 10);
    const statusFilter = opts.status?.toUpperCase();

    const where: Record<string, unknown> = {};
    if (statusFilter) where.status = statusFilter;

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        category: true,
        createdAt: true,
        publishedAt: true,
        scheduledFor: true,
      },
    });

    console.log(`\n  Blog Posts (${posts.length}${statusFilter ? `, status: ${statusFilter}` : ''})\n  ${HR}`);

    if (posts.length === 0) {
      console.log('  No posts found.\n');
      return;
    }

    for (const post of posts) {
      const dateStr = post.publishedAt
        ? fmtDate(post.publishedAt)
        : post.scheduledFor
          ? `sched: ${fmtDate(post.scheduledFor)}`
          : fmtDate(post.createdAt);

      console.log(`  ${post.id.slice(0, 8)}  ${post.status.padEnd(10)} ${post.category.padEnd(12)} ${dateStr}`);
      console.log(`           ${post.title}`);
    }

    console.log('');
  }));

// ── topics:refresh ──────────────────────────────────────────────────

program
  .command('topics:refresh')
  .description('Ensure the topic queue has at least 30 unused topics')
  .action(withDatabase(async () => {
    console.log(`\n  Refreshing topic queue...\n`);

    const topicManager = getTopicManager();
    const before = await topicManager.getQueueStats();
    console.log(`  Before: ${before.unused} unused topics`);

    await topicManager.refreshTopicQueue();

    const after = await topicManager.getQueueStats();
    console.log(`  After:  ${after.unused} unused topics (+${after.unused - before.unused})`);
    console.log('');
  }));

// ── Parse and run ───────────────────────────────────────────────────

program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
