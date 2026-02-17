# Blog Automation System

An automated blog posting system that uses Claude AI to research topics, generate high-quality technical blog posts, and publish them to your website on a configurable daily schedule with random posting times.

## Features

- **AI-Powered Content Generation** — Uses Claude Sonnet 4 to write 1500-2500 word technical blog posts with real code examples, proper structure, and SEO optimization
- **Automated Topic Research** — Gathers sources from the web, analyzes them with Claude, and produces structured research briefs before writing
- **Smart Topic Management** — AI-generated topic ideas with duplicate detection, relevance validation, and category-balanced rotation across JavaScript, TypeScript, and Frontend
- **Random Daily Scheduling** — Generates 2 posts per day (configurable) and publishes them at random times within a 9 AM – 9 PM window
- **Multi-CMS Publishing** — Supports WordPress REST API, custom REST APIs, and static sites via GitHub (adapter pattern)
- **CLI Interface** — Full command-line tool for generating posts, managing topics, testing connections, and viewing system status
- **Health Monitoring** — HTTP endpoints at `/health` and `/status` with database latency, queue metrics, and error tracking
- **PM2 Production Config** — Ready-to-use `ecosystem.config.js` with auto-restart, memory limits, and log rotation
- **Comprehensive Logging** — Winston with console (colorized), combined log file (JSON), and error log file
- **Graceful Shutdown** — Drains in-flight jobs before stopping, with 60-second timeout

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ TopicManager │────>│ ResearchSvc  │────>│ ContentGenerator│
│ (AI topics)  │     │ (web + Claude)│     │ (Claude Sonnet) │
└──────┬───────┘     └──────────────┘     └───────┬────────┘
       │                                          │
       │         ┌──────────────┐                 │
       └────────>│ BlogScheduler │<───────────────┘
                 │ (cron + HTTP) │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐     ┌───────────────┐
                 │PostingService │────>│ PublishService │
                 │ (DB pipeline) │     │ (CMS adapters) │
                 └───────────────┘     └───────────────┘
```

## Project Structure

```
blog-automation/
├── src/
│   ├── config/
│   │   ├── config.ts          # Configuration loading, validation, and defaults
│   │   ├── env.ts             # Re-exports config (backward compatibility)
│   │   └── logger.ts          # Winston logger with file and console transports
│   ├── database/
│   │   └── client.ts          # Singleton Prisma client, connect/disconnect
│   ├── schedulers/
│   │   ├── blogScheduler.ts   # Main scheduler (cron, health/status server)
│   │   └── blog.scheduler.ts  # Legacy scheduler (deprecated)
│   ├── services/
│   │   ├── topicManager.ts    # AI topic generation, queue management, validation
│   │   ├── researchService.ts # Web search + Claude analysis
│   │   ├── research.service.ts# Topic queue orchestrator
│   │   ├── contentGenerator.ts# Blog post generation with Claude Sonnet 4
│   │   ├── publishService.ts  # CMS adapter pattern (WP, Custom, Static)
│   │   ├── posting.service.ts # DB-side pipeline (drafts, scheduling, status)
│   │   └── ai.service.ts      # Legacy AI service
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces and types
│   ├── utils/
│   │   ├── helpers.ts         # slugify, sleep, retry, estimateReadingTime
│   │   └── formatters.ts      # Date formatting, markdown normalization
│   ├── index.ts               # Daemon entry point (scheduler mode)
│   └── cli.ts                 # CLI entry point (individual commands)
├── prisma/
│   ├── schema.prisma          # Database schema (BlogPost, TopicQueue, etc.)
│   └── migrations/            # Auto-generated SQL migrations
├── logs/                      # Log files (auto-created at runtime)
├── .env.example               # Environment variable template
├── ecosystem.config.js        # PM2 production configuration
├── setup.sh                   # Automated setup script
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | >= 18 | Tested with 18, 20, 22 |
| **PostgreSQL** | >= 14 | Any managed or local instance |
| **Anthropic API Key** | — | [Get one here](https://console.anthropic.com/) |
| **CMS / Website** | — | WordPress, custom API, or GitHub-hosted static site |

## Quick Start

### Automated Setup

```bash
cd blog-automation
chmod +x setup.sh
./setup.sh
```

The script checks Node.js, installs dependencies, creates `.env`, generates the Prisma client, and runs migrations.

### Manual Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment:**

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description | Example |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-api03-...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/blog_automation` |
| `WEBSITE_API_URL` | Your CMS API endpoint | `https://umesh-malik.com/wp-json/wp/v2` |
| `WEBSITE_TYPE` | CMS platform | `wordpress`, `custom`, or `static` |

3. **Set up the database:**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Seed initial topics:**

```bash
npm run topics:generate -- 30
```

5. **Test connections:**

```bash
npm run test-connection
```

6. **Start the system:**

```bash
# Development (with hot reload)
npm run dev:watch

# Production
npm run build
npm start
```

## Configuration

All configuration is loaded from environment variables (`.env` file). The system validates configuration at startup and reports errors.

### Configuration Categories

<details>
<summary><strong>AI / Anthropic</strong></summary>

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | **required** | API key from Anthropic Console |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Claude model for generation |
| `MAX_TOKENS` | `4096` | Max tokens per API response |

</details>

<details>
<summary><strong>Database</strong></summary>

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | **required** | PostgreSQL connection string |

</details>

<details>
<summary><strong>Website / CMS</strong></summary>

| Variable | Default | Description |
|---|---|---|
| `WEBSITE_TYPE` | `custom` | `wordpress`, `custom`, or `static` |
| `WEBSITE_API_URL` | **required** | CMS API endpoint |
| `WEBSITE_API_KEY` | **required** | API key or bearer token |
| `WP_USERNAME` | — | WordPress username (if type=wordpress) |
| `WP_APP_PASSWORD` | — | WordPress app password (if type=wordpress) |
| `GIT_REPO_URL` | — | GitHub repo `owner/repo` (if type=static) |
| `GIT_BRANCH` | `main` | Git branch (if type=static) |
| `GIT_TOKEN` | — | GitHub PAT (if type=static) |
| `PUBLISH_DRY_RUN` | `false` | Simulate publishing without changes |
| `PUBLISH_TIMEOUT` | `30000` | HTTP timeout in ms |

</details>

<details>
<summary><strong>Scheduling</strong></summary>

| Variable | Default | Description |
|---|---|---|
| `POSTS_PER_DAY` | `2` | Posts to generate daily (1-10) |
| `SCHEDULE_WINDOW_START` | `9` | Earliest publish hour (0-23) |
| `SCHEDULE_WINDOW_END` | `21` | Latest publish hour (0-23) |
| `MIN_POST_SPACING_HOURS` | `4` | Minimum hours between posts |
| `SKIP_WEEKENDS` | `false` | Skip Saturday/Sunday |
| `SCHEDULE_TIMEZONE` | `America/New_York` | IANA timezone |
| `GENERATION_CRON` | `0 2 * * *` | When to generate content |
| `PUBLISH_CHECK_CRON` | `0 * * * *` | How often to check for due posts |
| `HEALTH_CHECK_PORT` | `3000` | HTTP health/status port |

</details>

<details>
<summary><strong>Content</strong></summary>

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_LANGUAGE` | `en` | Content language (ISO 639-1) |
| `MIN_WORD_COUNT` | `1500` | Minimum words per post |
| `MAX_WORD_COUNT` | `2500` | Maximum words per post |

</details>

<details>
<summary><strong>Application</strong></summary>

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `production`, `test` |
| `LOG_LEVEL` | `info` | Winston log level |

</details>

## CLI Commands

All commands are available via `npm run` or directly via `npx ts-node src/cli.ts`.

| Command | Description |
|---|---|
| `npm run generate` | Generate one blog post (research, write, save as draft) |
| `npm run generate -- --publish` | Generate and immediately publish |
| `npm run publish -- <postId>` | Publish a specific post by database ID |
| `npm run schedule` | List all scheduled (pending) posts |
| `npm run list` | List recent posts (with `-n` and `-s` filters) |
| `npm run topics:add -- "Topic" -c TYPESCRIPT` | Add a manual topic |
| `npm run topics:generate -- 20` | Generate 20 AI topic ideas |
| `npm run topics:refresh` | Ensure queue has 30+ unused topics |
| `npm run test-connection` | Test database and CMS connectivity |
| `npm run status` | Full system status dashboard |

### Examples

```bash
# Generate a post and publish it immediately
npm run generate -- --publish

# Add a specific topic
npm run topics:add -- "Advanced TypeScript Generic Patterns in React" -c TYPESCRIPT

# Generate 30 topic ideas
npm run topics:generate -- 30

# List recent published posts
npm run list -- -s PUBLISHED -n 5

# Check system health
npm run status
```

## Deployment

### With PM2 (recommended)

```bash
# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs blog-automation

# Restart
pm2 restart blog-automation
```

PM2 is configured with:
- Auto-restart on crash (max 10 restarts, 5s delay)
- 500 MB memory limit
- 65s graceful shutdown timeout
- JSON log files with rotation support

Install log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### With systemd

Create `/etc/systemd/system/blog-automation.service`:

```ini
[Unit]
Description=Blog Automation System
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/blog-automation
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable blog-automation
sudo systemctl start blog-automation
```

### Health Monitoring

Once the daemon is running, check:

```bash
# Lightweight health check
curl http://localhost:3000/health

# Rich status dashboard
curl http://localhost:3000/status
```

The `/status` endpoint returns:
- Overall status (`healthy`, `degraded`, `error`)
- Database connectivity and latency
- Today's generation/publish/fail counts
- Scheduled posts count and next publish time
- Topic queue depth by category
- Last publish error details
- Scheduler state (active jobs, crons)

## Logging

Logs are written to three destinations:

| Destination | Format | Levels | Location |
|---|---|---|---|
| Console | Colorized, human-readable | All | stdout |
| `logs/combined.log` | JSON | All | 5 MB, 5 files rotated |
| `logs/error.log` | JSON | Error only | 5 MB, 5 files rotated |

Each service creates a child logger with its own `service` tag (e.g., `blog-scheduler`, `content-generator`, `posting-service`) for easy filtering.

## API Rate Limits and Costs

### Anthropic (Claude) API

| Operation | Calls/Post | Model | Est. Cost/Post |
|---|---|---|---|
| Topic generation | 1 per batch (~20 topics) | Sonnet 4 | ~$0.02 |
| Research analysis | 1 | Sonnet 4 | ~$0.03 |
| Content generation | 1-3 (retries on validation fail) | Sonnet 4 | ~$0.05-0.15 |
| SEO optimization | 1 | Sonnet 4 | ~$0.01 |

**Estimated daily cost at 2 posts/day: ~$0.20 – $0.40**

The system enforces rate limiting (1s between calls) and retries with exponential backoff on 429/529 errors. Monthly cost at 2 posts/day is approximately **$6 – $12**.

### Rate Limiting

All API clients implement:
- Minimum 1-second interval between calls
- Exponential backoff on rate limit errors (1.5s, 3s, 6s)
- Maximum 3 retry attempts per operation
- Separate rate limiters per service (research, generation, topics)

## Troubleshooting

### Common Issues

**"Missing required environment variable: ANTHROPIC_API_KEY"**
- Copy `.env.example` to `.env` and fill in your API key
- Run `npm run test-connection` to verify

**"Database connection failed"**
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Run `npx prisma migrate dev` to apply migrations

**"No pending topics in the queue"**
- Seed topics with `npm run topics:generate -- 30`
- Check queue status with `npm run status`

**"CMS connection could not be validated"**
- Verify `WEBSITE_API_URL` is accessible
- For WordPress: check `WP_USERNAME` and `WP_APP_PASSWORD`
- Run `npm run test-connection` for diagnostics
- Set `PUBLISH_DRY_RUN=true` to test without publishing

**"Content failed validation — retrying"**
- This is normal — the system automatically retries with feedback
- If persistent, check `logs/error.log` for details

**Posts are not publishing at scheduled times**
- Ensure the daemon is running (`npm start` or PM2)
- Check that `PUBLISH_CHECK_CRON` is configured (default: every hour)
- Verify timezone with `npm run schedule`

### Resetting the System

```bash
# Reset the database completely
npx prisma migrate reset

# Re-seed topics
npm run topics:generate -- 30

# Verify everything works
npm run test-connection
npm run status
```

## Database Schema

| Model | Purpose |
|---|---|
| **BlogPost** | Generated posts with status (DRAFT, SCHEDULED, PUBLISHED, FAILED) |
| **TopicQueue** | AI-generated topic ideas with priority and category |
| **PublishLog** | Audit trail of every publish attempt |
| **SystemConfig** | Key-value store for runtime configuration |

View and manage data with Prisma Studio:

```bash
npm run prisma:studio
```

## License

ISC
