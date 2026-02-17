# PostgreSQL → Cloudflare Stack Migration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Cloudflare Workers (Edge)               │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐        │
│  │ Cron Trigger │──────│Content Gen   │        │
│  │ (2x daily)   │      │ Pipeline     │        │
│  └──────────────┘      └──────┬───────┘        │
│                               │                 │
│  ┌──────────────┐      ┌─────▼────────┐        │
│  │ Publishing   │◄─────│ Queue        │        │
│  │ Consumer     │      │ Processor    │        │
│  └──────┬───────┘      └──────────────┘        │
│         │                                       │
│  ┌──────┴──────────────────────────────┐        │
│  │         HTTP API Routes             │        │
│  │  /health  /status  /api/*           │        │
│  └─────────────────────────────────────┘        │
│                                                 │
└─────────┼──────────────────────────────────────┘
          │
    ┌─────▼──────┐
    │            │
┌───▼──┐  ┌─────▼──┐  ┌────────┐
│  D1  │  │   KV   │  │   R2   │
│(SQL) │  │(Cache) │  │(Files) │
└──────┘  └────────┘  └────────┘
```

## Technology Mapping

| Previous (PostgreSQL Stack) | New (Cloudflare Stack) | Purpose |
|---|---|---|
| PostgreSQL + Prisma ORM | Cloudflare D1 (SQLite) | Primary database |
| PM2 + Node.js server | Cloudflare Workers | Compute (edge) |
| node-cron scheduler | Workers Cron Triggers | Job scheduling |
| File system | Cloudflare R2 | Asset & backup storage |
| Redis (if used) | Cloudflare KV | Caching layer |
| Bull/BullMQ | Cloudflare Queues | Async job processing |
| Docker + VPS | Cloudflare global edge | Infrastructure |

## Migration Timeline

### Phase 1: Infrastructure Setup (Day 1-2)

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Run the init script (creates D1, KV, R2, Queues)
cd blog-automation-cloudflare
npm install
./scripts/deploy.sh --init
```

After running `--init`, update `wrangler.toml` with the IDs printed by each create command:

```toml
[[d1_databases]]
database_id = "paste-d1-id-here"

[[kv_namespaces]]
id = "paste-kv-id-here"
```

Set secrets:

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put WEBSITE_API_URL
wrangler secret put WEBSITE_API_KEY
wrangler secret put SLACK_WEBHOOK_URL  # optional
```

### Phase 2: Data Migration (Day 3-4)

**Step 1: Export from PostgreSQL**

Run from the *original* `blog-automation/` directory:

```bash
cd ../blog-automation
DATABASE_URL=postgresql://... npx ts-node ../blog-automation-cloudflare/scripts/export-postgres-data.ts
```

This creates `migration-data/` with JSON exports.

**Step 2: Apply D1 Schema**

```bash
cd ../blog-automation-cloudflare
wrangler d1 migrations apply blog-automation-db
```

**Step 3: Import Data**

```bash
npx ts-node scripts/import-to-d1.ts
wrangler d1 execute blog-automation-db --file=./migration-data/import.sql
```

**Step 4: Seed Topics (if starting fresh)**

```bash
wrangler d1 execute blog-automation-db --file=./scripts/seed-topics.sql
```

**Step 5: Verify**

```bash
wrangler d1 execute blog-automation-db --command "SELECT COUNT(*) FROM blogs;"
wrangler d1 execute blog-automation-db --command "SELECT COUNT(*) FROM topic_queue WHERE used = 0;"
```

### Phase 3: Deploy & Test (Day 5-8)

```bash
# Deploy to staging first
./scripts/deploy.sh --staging

# Test the endpoints
curl https://blog-automation-staging.YOUR.workers.dev/health
curl https://blog-automation-staging.YOUR.workers.dev/status
curl https://blog-automation-staging.YOUR.workers.dev/api/topics/stats

# Trigger a manual content generation
curl -X POST https://blog-automation-staging.YOUR.workers.dev/api/generate

# Monitor logs
wrangler tail --env staging
```

### Phase 4: Production Cutover (Day 9-10)

```bash
# Deploy to production
./scripts/deploy.sh

# Verify
curl https://blog-automation.YOUR.workers.dev/health
```

## Key Differences from PostgreSQL

### Schema Changes

| PostgreSQL | D1 (SQLite) | Notes |
|---|---|---|
| `UUID` primary keys | `INTEGER AUTOINCREMENT` | SQLite doesn't support UUID natively |
| `JSONB` columns | `TEXT` (JSON strings) | Parse/stringify manually |
| `TIMESTAMPTZ` | `INTEGER` (Unix seconds) | Use `unixepoch()` for defaults |
| `BOOLEAN` | `INTEGER` (0/1) | SQLite convention |
| Prisma `@default(uuid())` | `AUTOINCREMENT` | Sequential IDs |
| Prisma `@updatedAt` | Manual `updated_at` | Set explicitly in queries |

### API Differences

**Before (Prisma):**
```typescript
const post = await prisma.blogPost.findUnique({ where: { id: 'uuid-here' } });
```

**After (D1):**
```typescript
const post = await env.DB.prepare('SELECT * FROM blogs WHERE id = ?').bind(42).first();
```

### Environment Configuration

**Before (.env file):**
```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
```

**After (wrangler.toml + secrets):**
```toml
# Non-sensitive values in wrangler.toml [vars]
[vars]
CLAUDE_MODEL = "claude-sonnet-4-20250514"

# Sensitive values via CLI
# wrangler secret put ANTHROPIC_API_KEY
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/status` | Full status dashboard |
| GET | `/api/blogs` | List recent blog posts |
| GET | `/api/blogs/:id` | Get single blog post |
| POST | `/api/generate` | Trigger content generation |
| POST | `/api/publish` | Trigger publish check |
| GET | `/api/topics/stats` | Topic queue statistics |
| POST | `/api/topics/generate` | Generate new topic ideas |
| POST | `/api/topics` | Add manual topics |
| GET | `/api/validate-connection` | Test CMS connectivity |
| GET | `/api/cache/stats` | Cache layer info |

## Cron Schedule

| Cron | Trigger | Action |
|---|---|---|
| `0 9 * * *` | 9 AM UTC | Generate morning content |
| `0 18 * * *` | 6 PM UTC | Generate afternoon content |
| `*/15 * * * *` | Every 15 min | Check & publish due posts |

## Cost Estimation

| Resource | Free Tier | Paid Tier | Estimated Monthly |
|---|---|---|---|
| Workers | 100K req/day | $5/10M req | $0 (well within free) |
| D1 | 5M rows read/day | $0.001/M rows | $0-1 |
| KV | 100K reads/day | $0.50/M reads | $0 |
| R2 | 10GB storage | $0.015/GB | $0 |
| Queues | 1M messages/mo | $0.40/M msg | $0 |
| **Total** | | | **$0-5/month** |

vs. previous VPS + PostgreSQL: **$10-40/month**

## Rollback Procedure

If issues arise after migration:

1. **Immediate**: The old PostgreSQL-based system remains untouched. Restart PM2:
   ```bash
   cd blog-automation && pm2 start ecosystem.config.js
   ```

2. **Disable Cloudflare crons**: Comment out `[triggers]` in `wrangler.toml` and redeploy.

3. **Data sync back**: Export from D1 and reimport to PostgreSQL if needed:
   ```bash
   wrangler d1 execute blog-automation-db --command "SELECT * FROM blogs WHERE created_at > X" --json > new-posts.json
   ```

## Monitoring

- **Live logs**: `wrangler tail` (real-time log streaming)
- **Dashboard**: Cloudflare Dashboard → Workers → Analytics
- **Alerts**: Slack webhook notifications on errors
- **Health**: `GET /health` and `GET /status` endpoints
