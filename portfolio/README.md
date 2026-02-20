# umesh-malik.com — SvelteKit Portfolio

Personal portfolio and blog for [umesh-malik.com](https://umesh-malik.com), built with SvelteKit 2, Svelte 5, and TailwindCSS 4. Deployed to Cloudflare Pages with a Cloudflare Worker + D1 (SQLite) for analytics.

## Architecture

```
┌───────────────────────────────────────────────────┐
│               Cloudflare Pages                    │
│                                                   │
│  ┌───────────────┐     ┌───────────────────────┐  │
│  │ Static Files  │     │  Cloudflare Worker    │  │
│  │ (build/)      │◄────│  (worker/index.ts)    │  │
│  │               │     │                       │  │
│  │ SvelteKit SSG │     │  /api/analytics/event │  │
│  │ pages         │     │  /api/analytics/live  │  │
│  │               │     │  /api/analytics/reads │  │
│  │               │     │  /api/analytics/stats │  │
│  └───────────────┘     └─────────┬─────────────┘  │
│                                  │                │
│                       ┌──────────▼───────────┐    │
│                       │  Cloudflare D1       │    │
│                       │  (SQLite database)   │    │
│                       └──────────────────────┘    │
└───────────────────────────────────────────────────┘
```

- **Frontend**: 100% Static Site Generation (SSG) via `@sveltejs/adapter-static`. All pages are prerendered at build time into `build/`.
- **Worker**: A Cloudflare Worker (`worker/index.ts`) is the entry point for all requests. It serves static files via `env.ASSETS.fetch()` and intercepts `/api/analytics/*` routes.
- **Database**: Cloudflare D1 (SQLite) stores all analytics data. Schema is in `worker/schema.sql`.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$props`, `$effect`)
- **Styling:** TailwindCSS 4 with `@tailwindcss/vite` and `@tailwindcss/typography`
- **Blog:** MDsveX (Markdown in Svelte) with Shiki syntax highlighting
- **SEO:** JSON-LD structured data, dynamic sitemaps, RSS/JSON feeds, `llms.txt`
- **Fonts:** Self-hosted Inter Variable + JetBrains Mono Variable
- **Deployment:** Cloudflare Pages + Workers
- **Database:** Cloudflare D1 (SQLite)
- **Language:** TypeScript (strict mode)

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npx wrangler` or `pnpm add -g wrangler`)
- A Cloudflare account (for production deployment)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start SvelteKit dev server (pages only, no analytics API)
pnpm dev
```

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, expertise, stats, projects, skills, timeline |
| `/about` | About page |
| `/projects` | Project showcase with live demo links |
| `/resume` | Resume / CV with print button |
| `/blog` | Blog with category and tag filtering |
| `/blog/[slug]` | Individual blog posts |
| `/contact` | Contact channels |
| `/faq` | FAQ accordion |
| `/uses` | Tools and equipment |
| `/resources` | Developer resources with code snippets |
| `/press` | Writing & appearances |
| `/analytics` | Private analytics dashboard (bearer token protected) |

### Generated Feeds & SEO

`/rss.xml`, `/feed.json`, `/sitemap.xml`, `/sitemap-index.xml`, `/blog-sitemap.xml`, `/robots.txt`, `/humans.txt`, `/llms.txt`, `/llms-full.txt`, `/.well-known/security.txt`

## Microfrontend: Retro Portfolio

The [Retro Portfolio (umesh.OS)](https://umesh-malik.com/projects/retro-portfolio) is a Windows 95-themed interactive desktop built with Astro 5 + React 19 + Three.js. It lives in the sibling `frontend/` directory and is integrated as a static microfrontend at `/projects/retro-portfolio`.

```bash
# Build everything (Astro sub-app + SvelteKit) in one command
pnpm build:full
```

---

## Analytics System

The site includes a custom privacy-friendly analytics system. No cookies, no third-party scripts — just session-based tracking via `navigator.sendBeacon`.

### How It Works

```
Browser  →  Analytics.svelte (beacon)    →  Worker POST /api/analytics/event  →  D1
Browser  →  LiveIndicator.svelte (poll)  →  Worker GET  /api/analytics/live   →  D1
Browser  →  BlogStats.svelte             →  Worker GET  /api/analytics/reads  →  D1
Browser  →  BlogCard (listing)           →  Worker POST /api/analytics/reads  →  D1
Browser  →  /analytics dashboard         →  Worker GET  /api/analytics/stats  →  D1
```

1. **Client-side** (`Analytics.svelte`): On each page visit, sends a `pageview` event via `navigator.sendBeacon`. Revisiting the same page in the same session sends `heartbeat` instead (avoids inflating counts). A heartbeat fires every 30s to keep the live session alive.

2. **Worker** (`worker/index.ts`): Inserts events into D1. For blog posts, deduplicates reads per session per day — refreshing a blog post 10 times counts as 1 read.

3. **Live indicator** (`LiveIndicator.svelte`): Polls `/api/analytics/live` every 10s. Shows "X online" with a scramble text animation.

4. **Cron cleanup**: Every 6 hours, the worker deletes stale live sessions (>2 min old) and old dedup rows (>48h old).

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analytics/event` | POST | Public | Record a pageview or heartbeat |
| `/api/analytics/live` | GET | Public | Global live visitor count (last 60s) |
| `/api/analytics/live?path=/blog/foo` | GET | Public | Live readers on a specific page |
| `/api/analytics/reads?path=/blog/foo` | GET | Public | All-time read count for a blog post |
| `/api/analytics/reads` | POST | Public | Batch read counts: `{ "paths": [...] }` |
| `/api/analytics/stats?days=7` | GET | Bearer | Dashboard stats (daily views, sources, top pages) |

### D1 Database Schema

4 tables (defined in `worker/schema.sql`):

| Table | Purpose |
|-------|---------|
| `events` | Every pageview/heartbeat with date, path, source, session_id |
| `reads` | Aggregated blog post read counts (path → count) |
| `reader_dedup` | Prevents counting same session twice per blog post per day |
| `live_sessions` | Tracks active sessions for live visitor count |

### Analytics Key Files

| File | Role |
|------|------|
| `worker/index.ts` | Cloudflare Worker — all API endpoints + cron cleanup |
| `worker/schema.sql` | D1 database schema (4 tables + indexes) |
| `wrangler.toml` | Worker entry point, D1 binding, cron trigger |
| `src/lib/components/layout/Analytics.svelte` | Client-side beacon (pageview + 30s heartbeat) |
| `src/lib/components/layout/LiveIndicator.svelte` | Floating "X online" pill |
| `src/lib/components/blog/BlogStats.svelte` | Per-post "X reading now / Y reads" |
| `src/lib/components/blog/BlogCard.svelte` | Blog card with optional read count |
| `src/routes/analytics/+page.svelte` | Private analytics dashboard UI |
| `vite.config.ts` | Dev proxy (`/api/analytics/*` → `localhost:8787`) |

---

## Local Development

### Option 1: SvelteKit only (no analytics)

```bash
pnpm dev
```

Runs at `http://localhost:5173`. All pages work. Analytics API calls fail silently — `Analytics.svelte` skips in dev mode (`if (dev) return`), LiveIndicator stays hidden, BlogStats stays hidden. This is fine for working on pages.

### Option 2: Full stack with Worker + D1 (analytics working)

Run two terminals side by side:

```bash
# Terminal 1 — Build the static site first
pnpm build

# Terminal 1 — Create local D1 database and apply schema (first time only)
npx wrangler d1 execute analytics --local --file=worker/schema.sql

# Terminal 1 — Start the worker (serves static files + API on port 8787)
npx wrangler dev
```

```bash
# Terminal 2 — SvelteKit dev server with HMR (port 5173)
# Vite proxies /api/analytics/* to localhost:8787
pnpm dev
```

This gives you:

- Hot module reload from SvelteKit on `:5173`
- Working analytics API from the Worker on `:8787`
- Local D1 SQLite database (stored in `.wrangler/state/`)

To test the protected stats endpoint:

```bash
# Set a local secret (first time only)
echo "test-secret" | npx wrangler secret put ANALYTICS_SECRET --local

# Query stats
curl http://localhost:8787/api/analytics/stats?days=7 \
  -H "Authorization: Bearer test-secret"
```

**Note**: After changing SvelteKit code, re-run `pnpm build` for the worker to serve updated pages. The worker reads from `build/`, not from Vite's dev server. Use the Vite dev server (Terminal 2) for normal development with HMR.

---

## Production Setup

### Why APIs Return 500

If all `/api/analytics/*` endpoints return 500 in production, the most likely causes are:

1. **D1 database does not exist** — the `database_id` in `wrangler.toml` doesn't match an actual D1 database in your Cloudflare account
2. **Schema not applied** — the D1 database exists but the tables haven't been created
3. **D1 binding not configured in Cloudflare Pages** — if deploying via Git integration, the D1 binding must be added in the Cloudflare dashboard

### Fix: Create D1 Database and Apply Schema

#### Step 1: Create the D1 database

```bash
npx wrangler d1 create analytics
```

This outputs something like:

```
Created D1 database 'analytics'
database_id = "abc123-..."
```

Update `wrangler.toml` with the new database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "analytics"
database_id = "<YOUR_NEW_DATABASE_ID>"
```

#### Step 2: Apply the schema

```bash
npx wrangler d1 execute analytics --remote --file=worker/schema.sql
```

This creates the 4 tables and indexes in the production D1 database.

#### Step 3: Verify tables exist

```bash
npx wrangler d1 execute analytics --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: `events`, `reads`, `reader_dedup`, `live_sessions`.

#### Step 4: Set the analytics secret

```bash
npx wrangler secret put ANALYTICS_SECRET
# Enter a strong random string when prompted
```

This protects the `/api/analytics/stats` endpoint. Other endpoints don't require it.

#### Step 5: Deploy

```bash
pnpm build && npx wrangler deploy
```

### If Using Cloudflare Pages Git Integration

If your site deploys automatically via Git push (Cloudflare Pages connected to GitHub), you need to configure the D1 binding in the Cloudflare dashboard:

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → your project → **Settings** → **Functions**
2. Under **D1 database bindings**, add:
   - Variable name: `DB`
   - D1 database: select your `analytics` database
3. Under **Environment variables**, add:
   - `ANALYTICS_SECRET` = your secret value
4. Redeploy (push a commit or trigger a manual deploy)

### Verify Production D1

```bash
# List all D1 databases
npx wrangler d1 list

# Check if tables exist
npx wrangler d1 execute analytics --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check event count
npx wrangler d1 execute analytics --remote \
  --command="SELECT COUNT(*) as total FROM events"

# Check live sessions
npx wrangler d1 execute analytics --remote \
  --command="SELECT COUNT(*) as active FROM live_sessions WHERE last_seen > datetime('now', '-60 seconds')"
```

---

## Build & Deploy

```bash
# Type check
pnpm check

# Build SvelteKit only
pnpm build

# Build everything including microfrontends
pnpm build:full

# Preview locally
pnpm preview

# Deploy to Cloudflare (worker + static files)
pnpm build && npx wrangler deploy
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start SvelteKit dev server (no analytics) |
| `pnpm build` | Build SvelteKit static site + inline CSS |
| `pnpm build:full` | Build microfrontends + SvelteKit |
| `pnpm preview` | Preview the built site |
| `pnpm check` | TypeScript + Svelte type checking |
| `npx wrangler dev` | Run worker locally with local D1 |
| `npx wrangler deploy` | Deploy worker + static site to production |

## Project Structure

```
portfolio/
├── src/
│   ├── app.css                # Global styles + theme tokens (dark/light)
│   ├── app.html               # HTML shell
│   ├── routes/                # SvelteKit pages
│   │   ├── +page.svelte       # Homepage
│   │   ├── +layout.svelte     # Root layout (Header, Footer, Analytics, LiveIndicator)
│   │   ├── about/
│   │   ├── analytics/         # Private dashboard
│   │   ├── blog/
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── press/
│   │   ├── projects/
│   │   ├── resources/
│   │   ├── resume/
│   │   └── uses/
│   └── lib/
│       ├── components/
│       │   ├── layout/        # Header, Footer, SEO, Analytics, LiveIndicator
│       │   ├── sections/      # Homepage sections (Hero, Stats, Projects, etc.)
│       │   ├── blog/          # BlogCard, BlogStats, ScrollToTop, etc.
│       │   └── ui/            # Button, Badge, Tag, CopyButton, ThemeToggle
│       ├── data/              # Static data (resume, skills, contacts, projects)
│       ├── posts/             # Blog posts (.md files)
│       ├── config/            # Site config (site.ts)
│       ├── types/             # TypeScript types
│       └── utils/             # Utilities (magnetic, tilt, transitions, schema)
├── worker/
│   ├── index.ts               # Cloudflare Worker (serves static + analytics API)
│   └── schema.sql             # D1 database schema
├── static/                    # Static assets (images, fonts, manifest)
├── scripts/                   # Build scripts (microfrontends, SEO, syndication)
├── wrangler.toml              # Cloudflare Worker + D1 config + cron trigger
├── svelte.config.js           # SvelteKit + MDsveX config
├── vite.config.ts             # Vite + TailwindCSS + analytics proxy
└── package.json
```
