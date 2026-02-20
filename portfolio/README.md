# umesh-malik.com — SvelteKit Portfolio

Personal portfolio and blog for [umesh-malik.com](https://umesh-malik.com), built with SvelteKit 2, Svelte 5, and TailwindCSS 4. Deployed to Cloudflare Pages.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes)
- **Styling:** TailwindCSS 4 with `@tailwindcss/typography`
- **Blog:** MDsveX (Markdown in Svelte) with Shiki syntax highlighting
- **SEO:** JSON-LD structured data, dynamic sitemaps, RSS/JSON feeds, `llms.txt`
- **Deployment:** Cloudflare Pages via `@sveltejs/adapter-cloudflare`
- **Language:** TypeScript (strict mode)

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, expertise, projects, skills, timeline |
| `/about` | About page |
| `/projects` | Project showcase with live demo links |
| `/resume` | Resume / CV |
| `/blog` | Blog with category and tag filtering |
| `/blog/[slug]` | Individual blog posts |
| `/contact` | Contact form |
| `/faq` | Frequently asked questions |
| `/uses` | Tools and equipment |
| `/resources` | Developer resources |
| `/ai-summary` | AI-optimized summary |
| `/press` | Press mentions |

### Generated Feeds & SEO

`/rss.xml`, `/feed.json`, `/sitemap.xml`, `/sitemap-index.xml`, `/blog-sitemap.xml`, `/robots.txt`, `/humans.txt`, `/llms.txt`, `/llms-full.txt`, `/.well-known/security.txt`

## Microfrontend: Retro Portfolio

The [Retro Portfolio (umesh.OS)](https://umesh-malik.com/projects/retro-portfolio) is a Windows 95-themed interactive desktop built with Astro 5 + React 19 + Three.js. It lives in the sibling `frontend/` directory and is integrated as a static microfrontend at `/projects/retro-portfolio`.

The `build:full` command handles the entire pipeline — building the Astro sub-app, copying its output into `static/projects/retro-portfolio/`, and then building the SvelteKit app.

To add another microfrontend in the future, add an entry to the `MICROFRONTENDS` array in `scripts/build-microfrontends.sh`.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9

## Getting Started

```sh
# Install dependencies (run from this directory)
pnpm install

# Also install the retro portfolio sub-app dependencies
cd ../frontend && pnpm install && cd ../portfolio
```

## Development

```sh
# Start dev server (SvelteKit only)
pnpm dev
```

The retro portfolio sub-app at `/projects/retro-portfolio` won't be available in dev mode since it's served as static files. To test the full setup locally, use the full build + preview flow below.

## Build & Preview

```sh
# Build everything (Astro sub-app + SvelteKit) in one command
pnpm build:full

# Preview the production build locally
pnpm preview
```

This will:

1. Build the Astro retro portfolio with `base: /projects/retro-portfolio`
2. Copy the output to `static/projects/retro-portfolio/`
3. Remove conflicting files (robots.txt, sitemaps, `_headers`, `_redirects`)
4. Build the SvelteKit app with the Cloudflare adapter

## Deploy to Cloudflare Pages

```sh
pnpm build:full
```

That single command produces the complete deployment artifact. Connect your GitHub repo to Cloudflare Pages with:

| Setting | Value |
|---|---|
| Build command | `cd portfolio && pnpm build:full` |
| Build output directory | `portfolio/.svelte-kit/cloudflare` |
| Root directory | `/` (repo root) |
| Node.js version | `20` |

Cloudflare Pages will automatically deploy on every push. The `_headers` and `_redirects` files at the project root are picked up by the Cloudflare adapter and included in the output.

### Manual deploy with Wrangler

```sh
# One command: build + deploy
pnpm build:full && npx wrangler pages deploy .svelte-kit/cloudflare --project-name=umesh-malik
```

## Project Structure

```
portfolio/
├── src/
│   ├── routes/              # Pages and API endpoints
│   ├── lib/
│   │   ├── components/      # Svelte components (layout, sections, ui, blog)
│   │   ├── config/          # Site configuration (site.ts)
│   │   ├── data/            # Structured data (projects, skills, resume)
│   │   ├── posts/           # Blog posts (Markdown)
│   │   ├── utils/           # Utilities (blog, schema, XML)
│   │   └── types/           # TypeScript definitions
│   ├── hooks.server.ts      # Security headers middleware
│   └── app.css              # Global styles
├── static/                  # Static assets (fonts, images, logos)
├── scripts/
│   └── build-microfrontends.sh  # Microfrontend build pipeline
├── _headers                 # Cloudflare Pages cache/security headers
├── _redirects               # Cloudflare Pages redirect rules
├── svelte.config.js         # SvelteKit + mdsvex + Cloudflare adapter
├── vite.config.ts           # Vite + TailwindCSS
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build SvelteKit only |
| `pnpm build:full` | Build microfrontends + SvelteKit (production) |
| `pnpm preview` | Preview production build locally |
| `pnpm check` | Run TypeScript and Svelte type checks |

## Analytics

The site includes a built-in analytics system powered by a Cloudflare Worker + KV Store. It tracks:

- **Live user count** — visible to all visitors via a floating pill at the bottom-right
- **Traffic sources** — direct, google, linkedin, twitter, github, referral, etc.
- **Daily page views** — aggregated per day
- **Blog-specific metrics** — live readers per post + all-time read counts shown on blog cards and post headers
- **Private dashboard** at `/analytics` — password-protected, shows charts and tables

### Architecture

```
Browser  →  Analytics.svelte (beacon)    →  Worker POST /api/analytics/event  →  KV
Browser  →  LiveIndicator.svelte         →  Worker GET  /api/analytics/live   →  KV
Browser  →  BlogStats.svelte             →  Worker GET  /api/analytics/live?path= & /reads  →  KV
Browser  →  BlogCard (listing)           →  Worker POST /api/analytics/reads (batch)  →  KV
Browser  →  /analytics dashboard         →  Worker GET  /api/analytics/stats  →  KV
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analytics/event` | POST | Public | Records a page view (path, source, sessionId) |
| `/api/analytics/live` | GET | Public | Returns global live user count |
| `/api/analytics/live?path=/blog/foo` | GET | Public | Returns live readers on a specific page |
| `/api/analytics/reads?path=/blog/foo` | GET | Public | Returns all-time read count for a blog post |
| `/api/analytics/reads` | POST | Public | Batch read counts — body: `{ paths: ["/blog/a", "/blog/b"] }` |
| `/api/analytics/stats?days=7` | GET | Bearer token | Aggregated dashboard stats (daily views, sources, top pages) |

### Analytics Setup

#### Step 1: Create the KV Namespace

```bash
npx wrangler kv namespace create ANALYTICS
```

This outputs a namespace ID. Paste it into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ANALYTICS"
id = "<paste-your-id-here>"
```

#### Step 2: Set the Dashboard Secret

The `/analytics` dashboard is protected by a bearer token. Set it as a Cloudflare secret:

```bash
npx wrangler secret put ANALYTICS_SECRET
# Enter your chosen password when prompted
```

When you visit `/analytics` in the browser, you'll be prompted to enter this password.

#### Step 3: Local Development (Full Stack with Analytics)

To test analytics locally, run **two terminals side by side**:

```bash
# Terminal 1 — Cloudflare Worker + KV (runs on port 8787)
npx wrangler dev

# Terminal 2 — SvelteKit dev server with hot reload (runs on port 5173)
pnpm dev
```

Vite is configured to proxy `/api/analytics/*` requests to `localhost:8787` (see `vite.config.ts`), so you get:

- Hot module reload from SvelteKit on `:5173`
- Working analytics API from Wrangler on `:8787`

> **Note:** If you only run `pnpm dev` without Wrangler, analytics API calls fail silently — the LiveIndicator stays hidden, BlogStats stays hidden, and the dashboard shows an error. The rest of the site works normally.

#### Step 4: Deploy

```bash
# Build the static site
pnpm build

# Deploy Worker + static assets to Cloudflare
npx wrangler deploy
```

In production, the Worker handles all requests — `/api/analytics/*` routes are processed directly, everything else falls through to static assets via `env.ASSETS.fetch(request)`.

### Analytics Key Files

| File | Role |
|------|------|
| `worker/index.ts` | Cloudflare Worker — all API endpoints |
| `worker/tsconfig.json` | Worker-specific TypeScript config |
| `src/lib/components/layout/Analytics.svelte` | Client-side beacon — sends page view events + 30s heartbeat |
| `src/lib/components/layout/LiveIndicator.svelte` | Floating "X online" pill shown on all pages |
| `src/lib/components/blog/BlogStats.svelte` | Per-post "X reading now / Y total reads" in blog headers |
| `src/lib/components/blog/BlogCard.svelte` | Blog card with optional read count display |
| `src/routes/analytics/+page.svelte` | Password-protected dashboard UI |
| `wrangler.toml` | Worker entry point + KV namespace binding |
| `vite.config.ts` | Dev proxy config (`/api/analytics/*` → `localhost:8787`) |
