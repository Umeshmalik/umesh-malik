#!/usr/bin/env npx ts-node
// ============================================
// Maintenance Script — Cleanup Old Posts
// ============================================
//
// Removes old draft and failed posts from the database
// to keep the system clean and the database performant.
//
// Actions:
//   1. Delete FAILED posts older than 30 days
//   2. Delete DRAFT posts older than 60 days (never published)
//   3. Archive publish logs older than 90 days
//   4. Clean up used topics older than 180 days
//   5. Report storage savings
//
// Usage:
//   npx ts-node scripts/cleanup-old-posts.ts
//   npx ts-node scripts/cleanup-old-posts.ts --dry-run
//   npx ts-node scripts/cleanup-old-posts.ts --days 45
//
// ============================================

import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ── Configuration ───────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DAYS_FLAG = args.find((a) => a.startsWith('--days'));
const FAILED_AGE_DAYS = DAYS_FLAG ? parseInt(DAYS_FLAG.split('=')[1] || '30', 10) : 30;
const DRAFT_AGE_DAYS = FAILED_AGE_DAYS * 2;
const LOG_AGE_DAYS = FAILED_AGE_DAYS * 3;
const TOPIC_AGE_DAYS = 180;

// ── Helpers ─────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function log(message: string): void {
  const prefix = DRY_RUN ? '[DRY RUN] ' : '';
  console.log(`  ${prefix}${message}`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('============================================');
  console.log('  Cleanup Old Posts');
  console.log('============================================');
  console.log('');

  if (DRY_RUN) {
    console.log('  Mode: DRY RUN (no data will be deleted)');
    console.log('');
  }

  await prisma.$connect();

  let totalDeleted = 0;

  // ── 1. Delete old FAILED posts ──────────────────────────────────

  const failedCutoff = daysAgo(FAILED_AGE_DAYS);
  const failedCount = await prisma.blogPost.count({
    where: { status: PostStatus.FAILED, createdAt: { lt: failedCutoff } },
  });

  log(`Failed posts older than ${FAILED_AGE_DAYS} days: ${failedCount}`);

  if (!DRY_RUN && failedCount > 0) {
    const result = await prisma.blogPost.deleteMany({
      where: { status: PostStatus.FAILED, createdAt: { lt: failedCutoff } },
    });
    log(`  Deleted ${result.count} failed posts`);
    totalDeleted += result.count;
  }

  // ── 2. Delete old DRAFT posts ───────────────────────────────────

  const draftCutoff = daysAgo(DRAFT_AGE_DAYS);
  const draftCount = await prisma.blogPost.count({
    where: { status: PostStatus.DRAFT, createdAt: { lt: draftCutoff } },
  });

  log(`Draft posts older than ${DRAFT_AGE_DAYS} days: ${draftCount}`);

  if (!DRY_RUN && draftCount > 0) {
    const result = await prisma.blogPost.deleteMany({
      where: { status: PostStatus.DRAFT, createdAt: { lt: draftCutoff } },
    });
    log(`  Deleted ${result.count} draft posts`);
    totalDeleted += result.count;
  }

  // ── 3. Archive old publish logs ─────────────────────────────────

  const logCutoff = daysAgo(LOG_AGE_DAYS);
  const logCount = await prisma.publishLog.count({
    where: { attemptedAt: { lt: logCutoff } },
  });

  log(`Publish logs older than ${LOG_AGE_DAYS} days: ${logCount}`);

  if (!DRY_RUN && logCount > 0) {
    const result = await prisma.publishLog.deleteMany({
      where: { attemptedAt: { lt: logCutoff } },
    });
    log(`  Deleted ${result.count} publish log entries`);
    totalDeleted += result.count;
  }

  // ── 4. Clean up used topics ─────────────────────────────────────

  const topicCutoff = daysAgo(TOPIC_AGE_DAYS);
  const topicCount = await prisma.topicQueue.count({
    where: { used: true, usedAt: { lt: topicCutoff } },
  });

  log(`Used topics older than ${TOPIC_AGE_DAYS} days: ${topicCount}`);

  if (!DRY_RUN && topicCount > 0) {
    const result = await prisma.topicQueue.deleteMany({
      where: { used: true, usedAt: { lt: topicCutoff } },
    });
    log(`  Deleted ${result.count} used topics`);
    totalDeleted += result.count;
  }

  // ── Summary ─────────────────────────────────────────────────────

  console.log('');
  log(`Total records cleaned: ${totalDeleted}`);
  console.log('');

  // Current counts
  const [postCount, topicTotal, logTotal] = await Promise.all([
    prisma.blogPost.count(),
    prisma.topicQueue.count(),
    prisma.publishLog.count(),
  ]);

  log(`Current totals: ${postCount} posts, ${topicTotal} topics, ${logTotal} publish logs`);
  console.log('');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Cleanup failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
