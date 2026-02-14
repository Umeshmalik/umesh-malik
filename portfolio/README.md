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
