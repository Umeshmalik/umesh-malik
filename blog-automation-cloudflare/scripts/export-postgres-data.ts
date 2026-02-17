#!/usr/bin/env npx ts-node
// ============================================
// Data Migration — Export from PostgreSQL
// ============================================
//
// Exports all data from the existing PostgreSQL/Prisma
// database into JSON files that can be imported into D1.
//
// Usage:
//   DATABASE_URL=postgresql://... npx ts-node scripts/export-postgres-data.ts
//
// Output:
//   ./migration-data/blogs.json
//   ./migration-data/topics.json
//   ./migration-data/publish-logs.json
//   ./migration-data/system-config.json
//
// ============================================

// NOTE: This script runs in the Node.js environment (blog-automation project),
// NOT in the Cloudflare Workers project. Copy it there or run from the
// blog-automation directory with the Prisma client available.

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const OUTPUT_DIR = path.join(__dirname, '../migration-data');

async function main() {
  console.log('');
  console.log('============================================');
  console.log('  PostgreSQL → D1 Data Export');
  console.log('============================================');
  console.log('');

  await prisma.$connect();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ── Export Blog Posts ────────────────────────────────────────────
  console.log('  Exporting blog posts...');
  const blogs = await prisma.blogPost.findMany({ orderBy: { createdAt: 'asc' } });
  const blogRows = blogs.map((b) => ({
    title: b.title,
    content: b.content,
    slug: b.slug,
    category: b.category,
    status: b.status.toLowerCase(),
    research_data: b.researchSources ? JSON.stringify(b.researchSources) : null,
    metadata: b.metadata ? JSON.stringify(b.metadata) : null,
    scheduled_for: b.scheduledFor ? Math.floor(b.scheduledFor.getTime() / 1000) : null,
    published_at: b.publishedAt ? Math.floor(b.publishedAt.getTime() / 1000) : null,
    created_at: Math.floor(b.createdAt.getTime() / 1000),
    updated_at: Math.floor(b.updatedAt.getTime() / 1000),
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'blogs.json'), JSON.stringify(blogRows, null, 2));
  console.log(`    ${blogRows.length} blog posts exported`);

  // ── Export Topics ───────────────────────────────────────────────
  console.log('  Exporting topic queue...');
  const topics = await prisma.topicQueue.findMany({ orderBy: { createdAt: 'asc' } });
  const topicRows = topics.map((t) => ({
    topic: t.topic,
    category: t.category,
    priority: t.priority,
    used: t.used ? 1 : 0,
    used_at: t.usedAt ? Math.floor(t.usedAt.getTime() / 1000) : null,
    created_at: Math.floor(t.createdAt.getTime() / 1000),
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'topics.json'), JSON.stringify(topicRows, null, 2));
  console.log(`    ${topicRows.length} topics exported`);

  // ── Export Publish Logs ─────────────────────────────────────────
  console.log('  Exporting publish logs...');
  const logs = await prisma.publishLog.findMany({ orderBy: { attemptedAt: 'asc' } });
  const logRows = logs.map((l) => ({
    // We'll need to map the UUID post IDs to new integer IDs during import
    original_post_id: l.postId,
    success: l.success ? 1 : 0,
    error_message: l.errorMessage,
    attempted_at: Math.floor(l.attemptedAt.getTime() / 1000),
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'publish-logs.json'), JSON.stringify(logRows, null, 2));
  console.log(`    ${logRows.length} publish log entries exported`);

  // ── Export System Config ────────────────────────────────────────
  console.log('  Exporting system config...');
  const configs = await prisma.systemConfig.findMany();
  const configRows = configs.map((c) => ({
    key: c.key,
    value: JSON.stringify(c.value),
    updated_at: Math.floor(c.updatedAt.getTime() / 1000),
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'system-config.json'), JSON.stringify(configRows, null, 2));
  console.log(`    ${configRows.length} config entries exported`);

  // ── Create ID mapping for publish logs ──────────────────────────
  // The mapping file helps associate old UUID post IDs with new integer IDs
  const idMapping = blogs.map((b, idx) => ({
    oldId: b.id,        // UUID from PostgreSQL
    newId: idx + 1,     // Auto-increment ID in D1
    slug: b.slug,
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'id-mapping.json'), JSON.stringify(idMapping, null, 2));
  console.log(`    ID mapping created for ${idMapping.length} posts`);

  console.log('');
  console.log(`  Export complete! Files saved to: ${OUTPUT_DIR}`);
  console.log('');
  console.log('  Next steps:');
  console.log('    1. Review the exported JSON files');
  console.log('    2. Run the D1 import script: npx wrangler d1 execute blog-automation-db --file=scripts/import-to-d1.sql');
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Export failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
