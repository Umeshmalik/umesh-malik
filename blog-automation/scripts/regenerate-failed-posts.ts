#!/usr/bin/env npx ts-node
// ============================================
// Maintenance Script — Regenerate Failed Posts
// ============================================
//
// Finds blog posts with FAILED status and re-attempts
// the content generation and/or publishing pipeline.
//
// Actions:
//   1. Find all FAILED posts
//   2. For each post, re-run research + content generation
//   3. Update the post in the database
//   4. Optionally re-publish
//
// Usage:
//   npx ts-node scripts/regenerate-failed-posts.ts
//   npx ts-node scripts/regenerate-failed-posts.ts --limit 5
//   npx ts-node scripts/regenerate-failed-posts.ts --publish
//   npx ts-node scripts/regenerate-failed-posts.ts --dry-run
//
// ============================================

import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ── Configuration ───────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const AUTO_PUBLISH = args.includes('--publish');

function getArgValue(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

const LIMIT = parseInt(getArgValue('--limit', '10'), 10);

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Lazy-import services (they need config/env which loads .env)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ResearchService } = require('../src/services/researchService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ContentGenerator } = require('../src/services/contentGenerator');

  console.log('');
  console.log('============================================');
  console.log('  Regenerate Failed Posts');
  console.log('============================================');
  console.log('');

  if (DRY_RUN) {
    console.log('  Mode: DRY RUN (no changes will be made)');
  }
  if (AUTO_PUBLISH) {
    console.log('  Mode: Auto-publish enabled');
  }
  console.log(`  Limit: ${LIMIT} posts`);
  console.log('');

  await prisma.$connect();

  // ── Find failed posts ─────────────────────────────────────────

  const failedPosts = await prisma.blogPost.findMany({
    where: { status: PostStatus.FAILED },
    orderBy: { updatedAt: 'desc' },
    take: LIMIT,
  });

  if (failedPosts.length === 0) {
    console.log('  No failed posts found. Nothing to do.');
    console.log('');
    await prisma.$disconnect();
    return;
  }

  console.log(`  Found ${failedPosts.length} failed post(s):`);
  for (const post of failedPosts) {
    console.log(`    - [${post.id.slice(0, 8)}...] "${post.title}" (failed at ${post.updatedAt.toISOString()})`);
  }
  console.log('');

  // ── Initialize services ───────────────────────────────────────

  const researchService = new ResearchService({ rateLimitMs: 1000, maxRetries: 2 });
  const contentGenerator = new ContentGenerator();

  let regenerated = 0;
  let errors = 0;

  // ── Process each failed post ──────────────────────────────────

  for (const post of failedPosts) {
    console.log(`  Regenerating: "${post.title}"...`);

    try {
      // Step 1: Re-research the topic
      const research = await researchService.researchTopic(post.title, post.category);
      console.log(`    Research complete (${research.sources.length} sources, ${research.mainInsights.length} insights)`);

      // Step 2: Generate new content
      const content = await contentGenerator.generateBlogPost(research, post.title);
      console.log(`    Content generated (${content.wordCount} words, ${content.codeBlockCount} code blocks)`);

      if (DRY_RUN) {
        console.log(`    [DRY RUN] Would update post ${post.id}`);
        regenerated++;
        continue;
      }

      // Step 3: Update the post in the database
      const newStatus = AUTO_PUBLISH ? PostStatus.SCHEDULED : PostStatus.DRAFT;

      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          title: content.title,
          content: content.content,
          slug: content.slug,
          status: newStatus,
          metadata: JSON.parse(JSON.stringify(content.seo)),
          researchSources: JSON.parse(JSON.stringify(content.researchSources)),
          scheduledFor: AUTO_PUBLISH ? new Date() : null,
        },
      });

      console.log(`    Updated to ${newStatus}`);
      regenerated++;

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`    ERROR: ${msg}`);
      errors++;
    }

    // Brief pause between posts to respect rate limits
    if (failedPosts.indexOf(post) < failedPosts.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // ── Summary ─────────────────────────────────────────────────────

  console.log('');
  console.log('  Results:');
  console.log(`    Regenerated: ${regenerated}`);
  console.log(`    Errors:      ${errors}`);
  console.log(`    Skipped:     ${failedPosts.length - regenerated - errors}`);
  console.log('');

  if (AUTO_PUBLISH && !DRY_RUN) {
    console.log('  Auto-publish is enabled. Regenerated posts are now SCHEDULED.');
    console.log('  They will be published at the next publish check interval.');
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Regeneration failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
