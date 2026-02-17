// ============================================
// Data Migration — Import to Cloudflare D1
// ============================================
//
// Reads the exported JSON files and generates SQL
// INSERT statements for D1. Run the output SQL file
// via `wrangler d1 execute`.
//
// Usage:
//   npx ts-node scripts/import-to-d1.ts
//   wrangler d1 execute blog-automation-db --file=./migration-data/import.sql
//
// ============================================

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../migration-data');
const OUTPUT_FILE = path.join(DATA_DIR, 'import.sql');

function escapeSQL(str: string | null): string {
  if (str === null) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function main() {
  console.log('');
  console.log('============================================');
  console.log('  Generate D1 Import SQL');
  console.log('============================================');
  console.log('');

  const statements: string[] = [];
  statements.push('-- Auto-generated D1 import from PostgreSQL export');
  statements.push(`-- Generated at: ${new Date().toISOString()}`);
  statements.push('');
  statements.push('BEGIN TRANSACTION;');
  statements.push('');

  // ── Import Blogs ────────────────────────────────────────────────
  const blogsFile = path.join(DATA_DIR, 'blogs.json');
  if (fs.existsSync(blogsFile)) {
    const blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
    statements.push(`-- Blogs: ${blogs.length} rows`);

    for (const b of blogs) {
      statements.push(`INSERT INTO blogs (title, content, slug, category, status, research_data, metadata, scheduled_for, published_at, created_at, updated_at) VALUES (${escapeSQL(b.title)}, ${escapeSQL(b.content)}, ${escapeSQL(b.slug)}, ${escapeSQL(b.category)}, ${escapeSQL(b.status)}, ${escapeSQL(b.research_data)}, ${escapeSQL(b.metadata)}, ${b.scheduled_for ?? 'NULL'}, ${b.published_at ?? 'NULL'}, ${b.created_at}, ${b.updated_at});`);
    }
    statements.push('');
    console.log(`  Blogs: ${blogs.length} INSERT statements`);
  }

  // ── Import Topics ───────────────────────────────────────────────
  const topicsFile = path.join(DATA_DIR, 'topics.json');
  if (fs.existsSync(topicsFile)) {
    const topics = JSON.parse(fs.readFileSync(topicsFile, 'utf8'));
    statements.push(`-- Topics: ${topics.length} rows`);

    for (const t of topics) {
      statements.push(`INSERT INTO topic_queue (topic, category, priority, used, used_at, created_at) VALUES (${escapeSQL(t.topic)}, ${escapeSQL(t.category)}, ${t.priority}, ${t.used}, ${t.used_at ?? 'NULL'}, ${t.created_at});`);
    }
    statements.push('');
    console.log(`  Topics: ${topics.length} INSERT statements`);
  }

  // ── Import System Config ────────────────────────────────────────
  const configFile = path.join(DATA_DIR, 'system-config.json');
  if (fs.existsSync(configFile)) {
    const configs = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    statements.push(`-- System Config: ${configs.length} rows`);

    for (const c of configs) {
      statements.push(`INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (${escapeSQL(c.key)}, ${escapeSQL(c.value)}, ${c.updated_at});`);
    }
    statements.push('');
    console.log(`  System Config: ${configs.length} INSERT statements`);
  }

  statements.push('COMMIT;');

  // ── Write SQL file ──────────────────────────────────────────────
  fs.writeFileSync(OUTPUT_FILE, statements.join('\n'));
  console.log('');
  console.log(`  SQL file written: ${OUTPUT_FILE}`);
  console.log('');
  console.log('  Run the import:');
  console.log(`    wrangler d1 execute blog-automation-db --file=${OUTPUT_FILE}`);
  console.log('');
}

main();
