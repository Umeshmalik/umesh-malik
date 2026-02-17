// ============================================
// Cloudflare Worker Environment Bindings
// ============================================
//
// Defines the typed `Env` interface for all Workers bindings:
//   - D1 database
//   - KV namespace
//   - R2 bucket
//   - Queue producer
//   - Environment variables and secrets
//
// ============================================

export interface Env {
  // ── Cloudflare Bindings ─────────────────────────────────────────
  /** D1 SQL database */
  DB: D1Database;
  /** KV namespace for caching */
  CACHE: KVNamespace;
  /** R2 bucket for blog assets (images, backups) */
  ASSETS: R2Bucket;
  /** Queue producer for publish jobs */
  PUBLISH_QUEUE: Queue<PublishMessage>;

  // ── Secrets (set via `wrangler secret put`) ─────────────────────
  ANTHROPIC_API_KEY: string;
  WEBSITE_API_URL: string;
  WEBSITE_API_KEY: string;
  WP_USERNAME?: string;
  WP_APP_PASSWORD?: string;
  SLACK_WEBHOOK_URL?: string;

  // ── Environment Variables (set in wrangler.toml [vars]) ─────────
  WEBSITE_TYPE: string;
  POSTS_PER_DAY: string;
  SCHEDULE_WINDOW_START: string;
  SCHEDULE_WINDOW_END: string;
  MIN_POST_SPACING_HOURS: string;
  SCHEDULE_TIMEZONE: string;
  MIN_WORD_COUNT: string;
  MAX_WORD_COUNT: string;
  CLAUDE_MODEL: string;
  MAX_TOKENS: string;
  DRY_RUN: string;
  LOG_LEVEL: string;
}

// ── Queue Message Types ─────────────────────────────────────────────

export interface PublishMessage {
  blogId: number;
  scheduledTime: number;
  attempt?: number;
}

// ── D1 Row Types ────────────────────────────────────────────────────

export interface BlogRow {
  id: number;
  title: string;
  content: string;
  slug: string;
  category: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  research_data: string | null;
  metadata: string | null;
  scheduled_for: number | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface TopicRow {
  id: number;
  topic: string;
  category: string;
  priority: number;
  used: number; // D1 uses 0/1 for booleans
  used_at: number | null;
  created_at: number;
}

export interface PublishLogRow {
  id: number;
  blog_id: number;
  success: number; // 0/1
  error_message: string | null;
  attempted_at: number;
}

export interface SystemConfigRow {
  key: string;
  value: string; // JSON string
  updated_at: number;
}

// ── Content Types ───────────────────────────────────────────────────

export type PostCategory = 'JAVASCRIPT' | 'TYPESCRIPT' | 'FRONTEND';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export const ALL_CATEGORIES: readonly PostCategory[] = ['JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND'];

export interface GeneratedContent {
  title: string;
  content: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  wordCount: number;
  codeBlockCount: number;
}

export interface ResearchResult {
  topic: string;
  category: string;
  mainInsights: string[];
  currentTrends: string[];
  codeExamples: string[];
  bestPractices: string[];
  commonPitfalls: string[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  summary: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  dryRun: boolean;
}
