#!/usr/bin/env npx ts-node
// ============================================
// Maintenance Script — Database Backup
// ============================================
//
// Creates a JSON-based logical backup of all blog automation
// data (posts, topics, publish logs, system config).
//
// This is a portable backup format that doesn't require
// pg_dump — useful for managed databases that restrict
// direct tool access.
//
// Usage:
//   npx ts-node scripts/backup-database.ts
//   npx ts-node scripts/backup-database.ts --output ./backups
//   npx ts-node scripts/backup-database.ts --tables posts,topics
//
// ============================================

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ── Configuration ───────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArgValue(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

const OUTPUT_DIR = getArgValue('--output', './backups');
const TABLES_ARG = getArgValue('--tables', 'all');
const TABLES = TABLES_ARG === 'all'
  ? ['posts', 'topics', 'publishLogs', 'systemConfig']
  : TABLES_ARG.split(',').map((t) => t.trim());

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('============================================');
  console.log('  Database Backup');
  console.log('============================================');
  console.log('');

  await prisma.$connect();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`  Created backup directory: ${OUTPUT_DIR}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupData: Record<string, unknown[]> = {};
  let totalRecords = 0;

  // ── Export each table ─────────────────────────────────────────

  if (TABLES.includes('posts')) {
    console.log('  Exporting blog posts...');
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    backupData.blogPosts = posts;
    totalRecords += posts.length;
    console.log(`    ${posts.length} posts exported`);
  }

  if (TABLES.includes('topics')) {
    console.log('  Exporting topic queue...');
    const topics = await prisma.topicQueue.findMany({
      orderBy: { createdAt: 'desc' },
    });
    backupData.topicQueue = topics;
    totalRecords += topics.length;
    console.log(`    ${topics.length} topics exported`);
  }

  if (TABLES.includes('publishLogs')) {
    console.log('  Exporting publish logs...');
    const logs = await prisma.publishLog.findMany({
      orderBy: { attemptedAt: 'desc' },
    });
    backupData.publishLogs = logs;
    totalRecords += logs.length;
    console.log(`    ${logs.length} logs exported`);
  }

  if (TABLES.includes('systemConfig')) {
    console.log('  Exporting system config...');
    const configs = await prisma.systemConfig.findMany();
    backupData.systemConfig = configs;
    totalRecords += configs.length;
    console.log(`    ${configs.length} config entries exported`);
  }

  // ── Write backup file ─────────────────────────────────────────

  const backupFile = path.join(OUTPUT_DIR, `blog_automation_backup_${timestamp}.json`);

  const backup = {
    metadata: {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: Object.keys(backupData),
      totalRecords,
    },
    data: backupData,
  };

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  const fileSizeMb = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);

  console.log('');
  console.log(`  Backup complete!`);
  console.log(`  File: ${backupFile}`);
  console.log(`  Size: ${fileSizeMb} MB`);
  console.log(`  Records: ${totalRecords}`);
  console.log('');

  // ── Clean old backups (keep last 30) ──────────────────────────

  const backupFiles = fs.readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith('blog_automation_backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (backupFiles.length > 30) {
    const toDelete = backupFiles.slice(30);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
    console.log(`  Cleaned ${toDelete.length} old backup(s) (keeping last 30)`);
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Backup failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
