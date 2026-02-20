-- Analytics D1 Schema
-- Replaces Cloudflare KV storage for analytics tracking

-- Page views and source tracking (replaces pv:* and src:* KV keys)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    date TEXT NOT NULL,
    path TEXT NOT NULL,
    source TEXT NOT NULL,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'pageview'
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_date_path ON events(date, path);
CREATE INDEX IF NOT EXISTS idx_events_date_source ON events(date, source);

-- Blog post read counts (replaces reads:* KV keys)
CREATE TABLE IF NOT EXISTS reads (
    path TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

-- Reader deduplication (replaces reader:* KV keys with TTL)
CREATE TABLE IF NOT EXISTS reader_dedup (
    path TEXT NOT NULL,
    session_id TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (path, session_id, date)
);

CREATE INDEX IF NOT EXISTS idx_reader_dedup_created ON reader_dedup(created_at);

-- Live session tracking (replaces live:* KV keys with TTL)
CREATE TABLE IF NOT EXISTS live_sessions (
    session_id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_last_seen ON live_sessions(last_seen);
CREATE INDEX IF NOT EXISTS idx_live_sessions_path ON live_sessions(path, last_seen);
