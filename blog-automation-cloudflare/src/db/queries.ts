// ============================================
// D1 Database Query Layer
// ============================================
//
// Typed query functions for all database operations.
// Each function takes a D1Database binding and returns
// typed results. No ORM — direct SQL for D1 performance.
//
// ============================================

import type {
  BlogRow,
  TopicRow,
  PublishLogRow,
  PostCategory,
  PostStatus,
  GeneratedContent,
  ResearchResult,
} from '../types/env';

// ── Blog Posts ──────────────────────────────────────────────────────

export async function createBlog(
  db: D1Database,
  content: GeneratedContent,
  category: PostCategory,
  research: ResearchResult | null,
  scheduledFor: number | null,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .prepare(`
      INSERT INTO blogs (title, content, slug, category, status, research_data, metadata, scheduled_for, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      content.title,
      content.content,
      content.slug,
      category,
      scheduledFor ? 'scheduled' : 'draft',
      research ? JSON.stringify(research) : null,
      JSON.stringify({
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        tags: content.tags,
        excerpt: content.excerpt,
        wordCount: content.wordCount,
        codeBlockCount: content.codeBlockCount,
      }),
      scheduledFor,
      now,
      now,
    )
    .run();

  return result.meta.last_row_id;
}

export async function getBlogById(db: D1Database, id: number): Promise<BlogRow | null> {
  return db.prepare('SELECT * FROM blogs WHERE id = ?').bind(id).first<BlogRow>();
}

export async function getBlogBySlug(db: D1Database, slug: string): Promise<BlogRow | null> {
  return db.prepare('SELECT * FROM blogs WHERE slug = ?').bind(slug).first<BlogRow>();
}

export async function updateBlogStatus(
  db: D1Database,
  id: number,
  status: PostStatus,
  publishedAt?: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare('UPDATE blogs SET status = ?, published_at = ?, updated_at = ? WHERE id = ?')
    .bind(status, publishedAt ?? null, now, id)
    .run();
}

export async function getDueBlogs(db: D1Database): Promise<BlogRow[]> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db
    .prepare(`
      SELECT * FROM blogs
      WHERE status = 'scheduled' AND scheduled_for <= ?
      ORDER BY scheduled_for ASC
      LIMIT 10
    `)
    .bind(now)
    .all<BlogRow>();

  return result.results;
}

export async function getRecentBlogs(db: D1Database, limit: number = 20): Promise<BlogRow[]> {
  const result = await db
    .prepare('SELECT * FROM blogs ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<BlogRow>();

  return result.results;
}

export async function getTodayStats(db: D1Database): Promise<{
  generated: number;
  published: number;
  failed: number;
}> {
  const todayStart = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000);

  // Use D1 batch() for single round-trip instead of 3 separate queries
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as cnt FROM blogs WHERE created_at >= ?').bind(todayStart),
    db.prepare("SELECT COUNT(*) as cnt FROM blogs WHERE status = 'published' AND published_at >= ?").bind(todayStart),
    db.prepare("SELECT COUNT(*) as cnt FROM blogs WHERE status = 'failed' AND updated_at >= ?").bind(todayStart),
  ]);

  return {
    generated: (results[0].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    published: (results[1].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    failed: (results[2].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
  };
}

// ── Topic Queue ─────────────────────────────────────────────────────

export async function getNextTopic(
  db: D1Database,
  category?: PostCategory,
): Promise<TopicRow | null> {
  if (category) {
    return db
      .prepare('SELECT * FROM topic_queue WHERE used = 0 AND category = ? ORDER BY priority DESC, created_at ASC LIMIT 1')
      .bind(category)
      .first<TopicRow>();
  }
  return db
    .prepare('SELECT * FROM topic_queue WHERE used = 0 ORDER BY priority DESC, created_at ASC LIMIT 1')
    .first<TopicRow>();
}

export async function markTopicUsed(db: D1Database, id: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare('UPDATE topic_queue SET used = 1, used_at = ? WHERE id = ?')
    .bind(now, id)
    .run();
}

export async function addTopic(
  db: D1Database,
  topic: string,
  category: PostCategory,
  priority: number = 0,
): Promise<number> {
  const result = await db
    .prepare('INSERT INTO topic_queue (topic, category, priority) VALUES (?, ?, ?)')
    .bind(topic, category, priority)
    .run();

  return result.meta.last_row_id;
}

export async function addTopicsBatch(
  db: D1Database,
  topics: Array<{ topic: string; category: PostCategory; priority: number }>,
): Promise<number> {
  const stmt = db.prepare('INSERT INTO topic_queue (topic, category, priority) VALUES (?, ?, ?)');
  const batch = topics.map((t) => stmt.bind(t.topic, t.category, t.priority));
  await db.batch(batch);
  return topics.length;
}

export async function getTopicQueueStats(db: D1Database): Promise<{
  total: number;
  unused: number;
  byCategory: Record<PostCategory, number>;
}> {
  // Use D1 batch() for single round-trip instead of 5 separate queries
  const results = await db.batch([
    db.prepare('SELECT COUNT(*) as cnt FROM topic_queue'),
    db.prepare('SELECT COUNT(*) as cnt FROM topic_queue WHERE used = 0'),
    db.prepare("SELECT COUNT(*) as cnt FROM topic_queue WHERE used = 0 AND category = 'JAVASCRIPT'"),
    db.prepare("SELECT COUNT(*) as cnt FROM topic_queue WHERE used = 0 AND category = 'TYPESCRIPT'"),
    db.prepare("SELECT COUNT(*) as cnt FROM topic_queue WHERE used = 0 AND category = 'FRONTEND'"),
  ]);

  return {
    total: (results[0].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    unused: (results[1].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    byCategory: {
      JAVASCRIPT: (results[2].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
      TYPESCRIPT: (results[3].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
      FRONTEND: (results[4].results[0] as { cnt: number } | undefined)?.cnt ?? 0,
    },
  };
}

export async function getExistingTopics(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare('SELECT topic FROM topic_queue WHERE used = 0')
    .all<{ topic: string }>();

  return result.results.map((r) => r.topic);
}

// ── Publish Log ─────────────────────────────────────────────────────

export async function logPublishAttempt(
  db: D1Database,
  blogId: number,
  success: boolean,
  errorMessage?: string,
): Promise<void> {
  await db
    .prepare('INSERT INTO publish_log (blog_id, success, error_message) VALUES (?, ?, ?)')
    .bind(blogId, success ? 1 : 0, errorMessage ?? null)
    .run();
}

export async function getPublishHistory(
  db: D1Database,
  blogId: number,
): Promise<PublishLogRow[]> {
  const result = await db
    .prepare('SELECT * FROM publish_log WHERE blog_id = ? ORDER BY attempted_at DESC')
    .bind(blogId)
    .all<PublishLogRow>();

  return result.results;
}

// ── System Config ───────────────────────────────────────────────────

export async function getConfig(db: D1Database, key: string): Promise<unknown | null> {
  const row = await db
    .prepare('SELECT value FROM system_config WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();

  return row ? JSON.parse(row.value) : null;
}

export async function setConfig(db: D1Database, key: string, value: unknown): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`
      INSERT INTO system_config (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    .bind(key, JSON.stringify(value), now)
    .run();
}
