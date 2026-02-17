-- ============================================
-- Blog Automation D1 Schema — Initial Migration
-- ============================================
--
-- Cloudflare D1 (SQLite-based) schema for the
-- blog automation system. Migrated from PostgreSQL/Prisma.
--
-- Key differences from PostgreSQL:
--   - UUIDs → AUTOINCREMENT integers (D1 is SQLite)
--   - JSONB → TEXT (store JSON as strings)
--   - TIMESTAMPTZ → INTEGER (Unix timestamps in seconds)
--   - Boolean → INTEGER 0/1
--   - Enums → TEXT with CHECK constraints
--
-- ============================================

-- ── Blog Posts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blogs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  content       TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  category      TEXT    NOT NULL CHECK (category IN ('JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND')),
  status        TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  research_data TEXT,                       -- JSON: research sources and insights
  metadata      TEXT,                       -- JSON: SEO title, description, tags, excerpt
  scheduled_for INTEGER,                    -- Unix timestamp (seconds)
  published_at  INTEGER,                    -- Unix timestamp (seconds)
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_blogs_status       ON blogs (status);
CREATE INDEX IF NOT EXISTS idx_blogs_category     ON blogs (category);
CREATE INDEX IF NOT EXISTS idx_blogs_scheduled    ON blogs (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_blogs_published    ON blogs (published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_created      ON blogs (created_at);

-- ── Topic Queue ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS topic_queue (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic      TEXT    NOT NULL,
  category   TEXT    NOT NULL CHECK (category IN ('JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND')),
  priority   INTEGER NOT NULL DEFAULT 0,
  used       INTEGER NOT NULL DEFAULT 0,    -- 0 = false, 1 = true
  used_at    INTEGER,                       -- Unix timestamp
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_topics_used_priority ON topic_queue (used, priority DESC);
CREATE INDEX IF NOT EXISTS idx_topics_category      ON topic_queue (category);
CREATE INDEX IF NOT EXISTS idx_topics_created        ON topic_queue (created_at);

-- ── Publish Log ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS publish_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_id       INTEGER NOT NULL,
  success       INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  error_message TEXT,
  attempted_at  INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_publog_blog_id     ON publish_log (blog_id);
CREATE INDEX IF NOT EXISTS idx_publog_attempted   ON publish_log (attempted_at);
CREATE INDEX IF NOT EXISTS idx_publog_success     ON publish_log (success);

-- ── System Config ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_config (
  key        TEXT    PRIMARY KEY,
  value      TEXT    NOT NULL,              -- JSON string
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
