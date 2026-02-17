# Blog Automation — Cloudflare Workers

Fully serverless blog automation system that generates, schedules, and publishes AI-written blog posts. Runs entirely on Cloudflare's edge network with zero servers to manage.

```
┌─────────────────────────────────────────────────┐
│         Cloudflare Workers (Edge)               │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐         │
│  │ Cron Trigger │──────│ Content Gen  │         │
│  │ (2x daily)   │      │ Pipeline     │         │
│  └──────────────┘      └──────┬───────┘         │
│                               │                 │
│  ┌──────────────┐      ┌──────▼───────┐         │
│  │  Publisher   │◄─────│   Queue      │         │
│  │  Worker      │      │  Consumer    │         │
│  └──────┬───────┘      └──────────────┘         │
│         │                                       │
│  ┌──────┴──────────────────────────────┐        │
│  │         HTTP API Routes             │        │
│  │  /health  /status  /api/*           │        │
│  └─────────────────────────────────────┘        │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
      ┌───▼──┐  ┌───▼───┐  ┌──▼─────┐
      │  D1  │  │  KV   │  │   R2   │
      │(SQL) │  │(Cache)│  │(Files) │
      └──────┘  └───────┘  └────────┘
```

## Stack

| Layer | Service | Purpose |
|---|---|---|
| Compute | Cloudflare Workers | Edge runtime (TypeScript) |
| Database | Cloudflare D1 | SQLite-based SQL database |
| Cache | Cloudflare KV | Key-value cache (24h TTL) |
| Storage | Cloudflare R2 | S3-compatible object storage |
| Queue | Cloudflare Queues | Async publish job processing |
| Scheduling | Cron Triggers | Automated content generation |
| AI | Anthropic Claude API | Content & topic generation |

## Project Structure

```
blog-automation-cloudflare/
├── src/
│   ├── index.ts                  # Worker entry: cron + queue + HTTP handlers
│   ├── types/
│   │   └── env.ts                # Env bindings, row types, content types
│   ├── db/
│   │   └── queries.ts            # All D1 SQL queries (typed, no ORM)
│   ├── services/
│   │   ├── research.ts           # Web research via DuckDuckGo + Claude analysis
│   │   ├── content-generator.ts  # Blog post generation with validation & SEO
│   │   ├── topic-manager.ts      # AI topic generation, dedup, queue balance
│   │   ├── publisher.ts          # CMS publishing (WordPress / custom API)
│   │   ├── kv-cache.ts           # KV cache layer with TTLs & rate limiting
│   │   └── r2-storage.ts         # R2 backups, images, DB exports
│   └── utils/
│       └── helpers.ts            # Slug, markdown, similarity, logging
├── migrations/
│   └── 0001_initial_schema.sql   # D1 schema (blogs, topics, logs, config)
├── scripts/
│   ├── deploy.sh                 # Deployment automation
│   ├── seed-topics.sql           # 30 starter topics
│   ├── export-postgres-data.ts   # PostgreSQL → JSON export (migration)
│   └── import-to-d1.ts           # JSON → D1 SQL import (migration)
├── .github/workflows/
│   └── deploy.yml                # CI/CD: typecheck → staging → production
├── wrangler.toml                 # Cloudflare bindings + cron + vars
├── tsconfig.json
├── package.json
├── .dev.vars.example             # Local dev secrets template
└── .gitignore
```

---

## Prerequisites

- **Node.js 20+** and **npm**
- A **Cloudflare account** (free tier works)
- An **Anthropic API key** (for Claude)
- A **website/CMS** with a REST API to publish to (WordPress or custom)

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
cd blog-automation-cloudflare
npm install
```

### 2. Set up local secrets

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your real keys:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key
WEBSITE_API_URL=https://your-site.com/api
WEBSITE_API_KEY=your-cms-api-key
```

### 3. Apply the database schema locally

```bash
npm run db:migrate:local
```

### 4. Seed starter topics

```bash
wrangler d1 execute blog-automation-db --local --file=./scripts/seed-topics.sql
```

### 5. Start the local dev server

```bash
npm run dev
```

You'll see:

```
Your Worker has access to the following bindings:
  env.DB (blog-automation-db)           D1 Database     local
  env.CACHE (...)                       KV Namespace    local
  env.ASSETS (blog-automation-assets)   R2 Bucket       local
  env.PUBLISH_QUEUE (blog-publish-queue) Queue           local
  ...

⎔ Starting local server...
Ready on http://localhost:8787
```

### 6. Test it

```bash
# Health check
curl http://localhost:8787/health

# Full status dashboard
curl http://localhost:8787/status

# Topic queue stats
curl http://localhost:8787/api/topics/stats

# Trigger content generation manually
curl -X POST http://localhost:8787/api/generate

# Trigger a scheduled event (simulates cron)
curl http://localhost:8787/cdn-cgi/handler/scheduled
```

---

## Deploying to Cloudflare (Production)

### Step 1: Login to Cloudflare

```bash
wrangler login
```

This opens a browser window for OAuth authentication.

### Step 2: Create all infrastructure

Run the init script to create D1, KV, R2, and Queue resources:

```bash
./scripts/deploy.sh --init
```

This command creates:

| Resource | Command run automatically |
|---|---|
| D1 Database | `wrangler d1 create blog-automation-db` |
| KV Namespace | `wrangler kv namespace create CACHE` |
| R2 Bucket | `wrangler r2 bucket create blog-automation-assets` |
| Queue | `wrangler queues create blog-publish-queue` |
| Dead Letter Queue | `wrangler queues create blog-publish-dlq` |

**Each command prints an ID.** You need to copy those IDs.

### Step 3: Update wrangler.toml with the real IDs

Open `wrangler.toml` and replace the placeholder IDs:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blog-automation-db"
database_id = "abc123-your-real-d1-id"        # ← paste D1 ID here

[[kv_namespaces]]
binding = "CACHE"
id = "def456-your-real-kv-id"                 # ← paste KV ID here
```

The R2 bucket and Queue don't use IDs in `wrangler.toml` — they use names, which are already set.

### Step 4: Set secrets

Secrets are encrypted values that never appear in your code or config files:

```bash
# Required
wrangler secret put ANTHROPIC_API_KEY
# Prompt: paste your sk-ant-... key

wrangler secret put WEBSITE_API_URL
# Prompt: paste https://your-site.com/api

wrangler secret put WEBSITE_API_KEY
# Prompt: paste your CMS API key
```

Optional secrets:

```bash
# WordPress (only if WEBSITE_TYPE=wordpress)
wrangler secret put WP_USERNAME
wrangler secret put WP_APP_PASSWORD

# Slack error notifications
wrangler secret put SLACK_WEBHOOK_URL
```

### Step 5: Deploy

```bash
./scripts/deploy.sh
```

This runs:

1. D1 migrations (creates tables)
2. TypeScript type check
3. Worker deployment
4. Health check verification

Output:

```
============================================
  Deployment Complete
============================================

  Worker URL:  https://blog-automation.your-subdomain.workers.dev
  Health:      https://blog-automation.your-subdomain.workers.dev/health
  Status:      https://blog-automation.your-subdomain.workers.dev/status
```

### Step 6: Seed topics in production

```bash
wrangler d1 execute blog-automation-db --remote --file=./scripts/seed-topics.sql
```

### Step 7: Verify everything is running

```bash
# Check the worker is live
curl https://blog-automation.your-subdomain.workers.dev/health

# Check database and config
curl https://blog-automation.your-subdomain.workers.dev/status

# Check topics were seeded
curl https://blog-automation.your-subdomain.workers.dev/api/topics/stats
```

That's it — the cron triggers will now fire automatically at 9 AM and 6 PM UTC every day.

---

## Configuration Reference

### Environment Variables (wrangler.toml `[vars]`)

These are non-sensitive settings you edit directly in `wrangler.toml`:

| Variable | Default | Description |
|---|---|---|
| `WEBSITE_TYPE` | `"custom"` | CMS type: `"custom"`, `"wordpress"` |
| `POSTS_PER_DAY` | `"2"` | Blog posts to generate per day |
| `SCHEDULE_WINDOW_START` | `"9"` | Earliest publish hour (UTC) |
| `SCHEDULE_WINDOW_END` | `"21"` | Latest publish hour (UTC) |
| `MIN_POST_SPACING_HOURS` | `"4"` | Minimum hours between posts |
| `SCHEDULE_TIMEZONE` | `"America/New_York"` | Display timezone |
| `MIN_WORD_COUNT` | `"1500"` | Minimum words per post |
| `MAX_WORD_COUNT` | `"2500"` | Maximum words per post |
| `CLAUDE_MODEL` | `"claude-sonnet-4-20250514"` | Anthropic model to use |
| `MAX_TOKENS` | `"4096"` | Max tokens per Claude call |
| `DRY_RUN` | `"false"` | `"true"` to simulate without publishing |
| `LOG_LEVEL` | `"info"` | Logging verbosity |

### Secrets (set via `wrangler secret put`)

| Secret | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key |
| `WEBSITE_API_URL` | Yes | Base URL of your CMS API |
| `WEBSITE_API_KEY` | Yes | Authentication token for your CMS |
| `WP_USERNAME` | WordPress only | WordPress username |
| `WP_APP_PASSWORD` | WordPress only | WordPress application password |
| `SLACK_WEBHOOK_URL` | No | Slack webhook for error alerts |

### Cron Schedule

Defined in `wrangler.toml` under `[triggers]`:

| Cron | Time | Action |
|---|---|---|
| `0 9 * * *` | 9:00 AM UTC daily | Generate morning content |
| `0 18 * * *` | 6:00 PM UTC daily | Generate afternoon content |
| `*/15 * * * *` | Every 15 minutes | Check & publish scheduled posts |

To change the schedule, edit the `crons` array in `wrangler.toml` and redeploy.

---

## API Reference

All endpoints return JSON. The worker URL is `https://blog-automation.your-subdomain.workers.dev`.

### Health & Status

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Simple health check — returns `{"status":"ok"}` |
| `GET` | `/status` | Full dashboard: today's stats, queue health, config |

**Example — `/status` response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-08T16:54:20.176Z",
  "today": { "generated": 2, "published": 1, "failed": 0 },
  "topicQueue": {
    "unused": 28, "total": 32,
    "byCategory": { "JAVASCRIPT": 9, "TYPESCRIPT": 9, "FRONTEND": 10 },
    "needsRefresh": false
  },
  "scheduled": { "pending": 1 },
  "config": { "postsPerDay": 2, "websiteType": "custom", "dryRun": false }
}
```

### Blog Posts

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/blogs` | List the 20 most recent blog posts |
| `GET` | `/api/blogs/:id` | Get a single blog post by ID |

### Content Generation

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/generate` | Trigger content generation now (async, returns 202) |
| `POST` | `/api/publish` | Run publish check now (synchronous) |

**Example — manually trigger generation:**

```bash
curl -X POST https://blog-automation.your-subdomain.workers.dev/api/generate
# → {"message":"Content generation started"}
```

### Topic Management

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/topics/stats` | Queue statistics and category breakdown |
| `POST` | `/api/topics/generate` | Generate new topics via Claude AI |
| `POST` | `/api/topics` | Add topics manually |

**Example — add manual topics:**

```bash
curl -X POST https://blog-automation.your-subdomain.workers.dev/api/topics \
  -H 'Content-Type: application/json' \
  -d '{
    "topics": [
      "React 19 Server Components Deep Dive",
      "Building CLI Tools with TypeScript and Commander.js"
    ],
    "category": "FRONTEND",
    "priority": 8
  }'
# → {"added":2,"skipped":0}
```

**Example — generate AI topics:**

```bash
curl -X POST https://blog-automation.your-subdomain.workers.dev/api/topics/generate \
  -H 'Content-Type: application/json' \
  -d '{"count": 15}'
# → {"added":12,"rejected":3}
```

### Utilities

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/validate-connection` | Test CMS connectivity |
| `GET` | `/api/cache/stats` | KV cache information |

---

## How It Works

### Automated Daily Flow

Every day, the system runs this pipeline automatically (no manual intervention needed):

```
1. CRON FIRES (9 AM / 6 PM UTC)
   │
2. CHECK QUOTA — already generated enough posts today?
   │ no
3. PICK TOPIC — select from D1 queue (balanced across categories)
   │
4. RESEARCH — DuckDuckGo search → Claude analysis
   │
5. GENERATE — Claude writes full blog post (1500-2500 words)
   │         ↻ validation retry (up to 3 attempts)
   │
6. SEO PASS — Claude optimizes title, meta, tags, excerpt
   │
7. STORE — save to D1 with scheduled publish time
   │
8. QUEUE — send publish job to Cloudflare Queue
   │
9. PUBLISH CHECK (every 15 min) — is it time?
   │ yes
10. PUBLISH — POST to your CMS API
   │
11. LOG — record success/failure in D1
```

### Topic Queue

The system maintains a queue of blog topics in D1. Topics are:

- **Auto-generated** by Claude when the queue runs low (< 10 unused)
- **De-duplicated** using Jaccard similarity (threshold: 0.6)
- **Category-balanced** across JAVASCRIPT, TYPESCRIPT, FRONTEND
- **Priority-ranked** — under-represented categories get higher priority

You can also add topics manually via the API.

### Publishing

The publisher supports two CMS types:

**Custom API** (`WEBSITE_TYPE=custom`):

- `POST {WEBSITE_API_URL}/posts` with Bearer token auth
- Sends: title, content (markdown), slug, category, tags, SEO metadata

**WordPress** (`WEBSITE_TYPE=wordpress`):

- `POST {WEBSITE_API_URL}/wp-json/wp/v2/posts` with Basic auth
- Markdown is converted to HTML automatically
- Yoast SEO metadata is set if the plugin is installed

### Caching (KV)

Frequently accessed data is cached in KV to reduce D1 reads:

| Data | TTL | Key pattern |
|---|---|---|
| Generated content | 24 hours | `blog:{id}` |
| Queue stats | 5 minutes | `stats:{key}` |
| Dashboard | 1 minute | `dashboard` |

### Storage (R2)

R2 is used for durable file storage:

- Blog post backups (JSON snapshots)
- Image uploads
- Database export archives
- Auto-cleanup of files older than 30 days

---

## Common Operations

### View live logs

```bash
wrangler tail
```

This streams real-time logs from your production worker. Every log line is structured JSON:

```json
{"level":"info","message":"Cron triggered","ts":"2026-02-08T09:00:00.123Z","cron":"0 9 * * *"}
{"level":"info","message":"Content generated and queued","ts":"...","blogId":42,"topic":"..."}
```

### Query the database directly

```bash
# Count all published posts
wrangler d1 execute blog-automation-db --remote \
  --command "SELECT COUNT(*) FROM blogs WHERE status = 'published';"

# See recent posts
wrangler d1 execute blog-automation-db --remote \
  --command "SELECT id, title, status, datetime(created_at, 'unixepoch') as created FROM blogs ORDER BY id DESC LIMIT 5;"

# Check topic queue
wrangler d1 execute blog-automation-db --remote \
  --command "SELECT category, COUNT(*) as cnt FROM topic_queue WHERE used = 0 GROUP BY category;"
```

### Run database migrations

When you add new migration files to `migrations/`:

```bash
# Apply to production
npm run db:migrate

# Apply to local dev
npm run db:migrate:local
```

### Deploy to staging

Staging has `DRY_RUN=true` (no actual publishing) and `LOG_LEVEL=debug`:

```bash
npm run deploy:staging
# or
./scripts/deploy.sh --staging
```

### Enable dry-run mode in production

Edit `wrangler.toml`:

```toml
[vars]
DRY_RUN = "true"
```

Then redeploy: `npm run deploy`. Posts will be generated and stored in D1 but not actually published to your CMS.

### Change the cron schedule

Edit `wrangler.toml`:

```toml
[triggers]
crons = [
  "0 14 * * *",    # Once daily at 2 PM UTC
  "*/30 * * * *",  # Publish check every 30 minutes
]
```

Then redeploy: `npm run deploy`.

### Add a new database table

1. Create a new migration file:

```bash
touch migrations/0002_add_analytics.sql
```

1. Write the SQL:

```sql
CREATE TABLE IF NOT EXISTS analytics (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_id    INTEGER NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE
);
```

1. Apply:

```bash
npm run db:migrate          # production
npm run db:migrate:local    # local
```

---

## Migrating from the PostgreSQL Version

If you're migrating from the existing `blog-automation/` (PostgreSQL + Prisma + PM2) setup:

### 1. Export data from PostgreSQL

Run from the **old** project directory:

```bash
cd blog-automation
DATABASE_URL=postgresql://user:pass@host:5432/db \
  npx ts-node ../blog-automation-cloudflare/scripts/export-postgres-data.ts
```

This creates `migration-data/` with JSON files.

### 2. Generate import SQL

```bash
cd blog-automation-cloudflare
npx ts-node scripts/import-to-d1.ts
```

### 3. Import into D1

```bash
wrangler d1 execute blog-automation-db --remote --file=./migration-data/import.sql
```

### 4. Verify

```bash
wrangler d1 execute blog-automation-db --remote \
  --command "SELECT COUNT(*) as blogs FROM blogs; SELECT COUNT(*) as topics FROM topic_queue;"
```

### 5. Stop the old system

```bash
cd blog-automation
pm2 stop blog-automation
pm2 delete blog-automation
```

See `docs/MIGRATION_GUIDE.md` for the full migration reference.

---

## CI/CD (GitHub Actions)

The included `.github/workflows/deploy.yml` deploys automatically on push to `main`:

```
push to main → Type Check → Deploy Staging → Deploy Production → Slack Notify
```

### Required GitHub Secrets

Set these in your repo's Settings → Secrets → Actions:

| Secret | Where to find it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token (use "Edit Cloudflare Workers" template) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → any domain → Overview → right sidebar → Account ID |
| `WORKERS_SUBDOMAIN` | Your `*.workers.dev` subdomain (e.g., `my-account`) |
| `SLACK_WEBHOOK_URL` | *(Optional)* Slack Incoming Webhook URL for deploy notifications |

### GitHub Environments

Create two environments in Settings → Environments:

1. **staging** — no protection rules needed
2. **production** — add "Required reviewers" for manual approval before prod deploy

---

## Cost

| Resource | Free Tier | Estimated Monthly |
|---|---|---|
| Workers | 100K requests/day | $0 |
| D1 | 5M rows read/day, 100K writes/day | $0 |
| KV | 100K reads/day | $0 |
| R2 | 10 GB storage, 10M reads/month | $0 |
| Queues | 1M messages/month | $0 |
| **Claude API** | — | **$5–15** (depends on posts/day) |
| **Total** | | **~$5–15/month** |

The entire Cloudflare infrastructure is free for this workload. You only pay for Claude API usage.

---

## Troubleshooting

### "Worker not found" after deploy

Your worker URL is `https://blog-automation.<your-subdomain>.workers.dev`. Find your subdomain in the Cloudflare Dashboard under Workers & Pages → Overview.

### "D1_ERROR: no such table: blogs"

Migrations haven't been applied. Run:

```bash
wrangler d1 migrations apply blog-automation-db --remote
```

### "authentication_error: invalid x-api-key"

Your Anthropic API key isn't set or is wrong. Re-set it:

```bash
wrangler secret put ANTHROPIC_API_KEY
```

### Content generates but doesn't publish

1. Check `DRY_RUN` isn't `"true"` — look at `/status` response
2. Check the CMS connection: `curl https://your-worker/api/validate-connection`
3. Check publish logs: `wrangler d1 execute blog-automation-db --remote --command "SELECT * FROM publish_log ORDER BY attempted_at DESC LIMIT 5;"`

### Queue messages going to DLQ

Messages fail after 3 retries and land in `blog-publish-dlq`. Check:

```bash
wrangler queues list
```

Common causes: CMS is down, API key expired, rate limiting.

### Topic queue is empty

The system auto-generates topics when it drops below 10, but if Claude is unreachable it can't. Seed manually:

```bash
wrangler d1 execute blog-automation-db --remote \
  --file=./scripts/seed-topics.sql
```

### Cron not firing

Cron triggers only work in deployed (remote) workers. In local dev, simulate with:

```bash
curl http://localhost:8787/cdn-cgi/handler/scheduled
```

---

## npm Scripts Reference

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `wrangler dev` | Start local development server |
| `npm run deploy` | `wrangler deploy` | Deploy to production |
| `npm run deploy:staging` | `wrangler deploy --env staging` | Deploy to staging |
| `npm run db:create` | `wrangler d1 create ...` | Create the D1 database |
| `npm run db:migrate` | `wrangler d1 migrations apply ...` | Apply migrations (remote) |
| `npm run db:migrate:local` | `wrangler d1 migrations apply ... --local` | Apply migrations (local) |
| `npm run db:seed` | `wrangler d1 execute ... --file=seed` | Seed starter topics |
| `npm run typecheck` | `tsc --noEmit` | TypeScript type check |
| `npm run tail` | `wrangler tail` | Stream live production logs |
