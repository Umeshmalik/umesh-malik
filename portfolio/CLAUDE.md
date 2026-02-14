# Project Rules — SvelteKit Portfolio

These rules apply to all coding agents (Claude Code, Cursor, Copilot, etc.) working on this project.

## Architecture

- **Framework**: SvelteKit 2 with Svelte 5 (runes: `$state`, `$derived`, `$props`, `$effect`)
- **Rendering**: 100% Static Site Generation (SSG) via `@sveltejs/adapter-static`. No SSR, no hybrid rendering. Every page is prerendered at build time.
- **Styling**: TailwindCSS 4 with `@tailwindcss/vite` plugin. No PostCSS config needed.
- **Blog**: MDsveX (`.md` / `.svx` files) with rehype-slug and rehype-autolink-headings
- **Deployment**: Cloudflare Pages (static files served from `build/` directory)
- **Fonts**: Self-hosted via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`. No external Google Fonts.
- **Microfrontends**: Sub-apps (e.g., retro-portfolio) are built separately and copied into `static/projects/` at build time

## Design System

### Colors (defined in `src/app.css` `@theme` block)

- Background: `--color-brand-black: #000000`
- Accent (gold): `--color-brand-accent: #C09E5A`
- Accent hover: `--color-brand-accent-hover: #B8914F`
- Text primary: `#ffffff`
- Text secondary: `rgba(255, 255, 255, 0.6)`
- Text muted: `rgba(255, 255, 255, 0.5)` — minimum for WCAG AA on black
- Borders: `#2B2B2B`
- Card bg: `rgba(10, 10, 10, 0.5)`

### Typography

- Display/sans: `Inter Variable` (weights 300–600 only)
- Mono: `JetBrains Mono Variable` (weights 400–500 only)
- Utility classes: `.label-mono`, `.hero-headline`, `.section-title`, `.body-large`, `.body-medium`
- Never use font weights above 600 — they are not loaded

### Components

- `.corner-brackets` — decorative gold corner brackets on cards
- `.btn-brackets` — button with animated expanding corner brackets on hover
- `Button.svelte` — reusable button/link with `variant` (primary/secondary) and `size` props

## Web Vitals Requirements

### Performance

- **LCP target**: < 1.5s on all platforms (desktop and mobile)
- **FCP target**: < 1.5s on all platforms
- Never add external font services (Google Fonts, Adobe Fonts). Fonts are self-hosted.
- Never use `transition-all`. Always specify exact properties: `transition-colors`, `transition-[width]`, `transition-[background-color,border-color]`, etc.
- All scroll event listeners must use `{ passive: true }`
- Throttle scroll handlers with `requestAnimationFrame`
- Use IntersectionObserver with a **one-way latch** pattern (`hasBeenInView`). Never toggle content in/out of DOM based on scroll position — this causes layout thrashing.
- Images must have explicit `width` and `height` attributes
- Preload critical assets; lazy-load below-the-fold content

### Accessibility (WCAG AA)

- All text must meet 4.5:1 contrast ratio against its background. On `#000000`:
  - `rgba(255,255,255,0.5)` = ~5.28:1 (minimum muted text)
  - `rgba(255,255,255,0.6)` = ~7.51:1 (secondary text)
  - Never go below 0.5 opacity for text on black backgrounds
- Heading elements must be in sequentially descending order (h1 → h2 → h3). Never skip levels.
- Each page has exactly one `<h1>`. Use `<h2>` for sections, `<h3>` for subsections.
- All interactive elements must have visible focus styles (already set: `*:focus-visible` with gold outline)
- Buttons must have `type="button"` unless they submit a form
- Filter/toggle buttons must have `aria-pressed` attribute
- Links opening in new tabs must have `rel="noopener noreferrer"`
- Images must have `alt` text. Decorative SVGs use `aria-hidden="true"`
- Mobile menu toggle needs `aria-label`
- Use semantic HTML: `<nav>`, `<article>`, `<section>`, `<time>`, `<address>`
- Skip-to-content link is present in `+layout.svelte` — do not remove

### SEO

- Every page must have an `<SEO>` component with unique `title` and `description`
- Use breadcrumb structured data (`createBreadcrumbSchema`) on all pages
- Blog posts use article structured data (`createArticleSchema`)
- Contact page uses contact page structured data (`createContactPageSchema`)
- Canonical URLs use `https://umesh-malik.com` as the base
- All pages must be reachable from navigation or internal links (for prerender crawler)
- Dynamic routes (`[slug]`, `[category]`, `[tag]`) must export `entries()` functions
- Site config is centralized in `src/lib/config/site.ts`

## File Conventions

- Route pages: `src/routes/<path>/+page.svelte`
- Server load functions: `+page.server.ts` (for data that needs server context)
- Universal load functions: `+page.ts` (for data that can run anywhere)
- Shared components: `src/lib/components/` (organized by domain: `layout/`, `sections/`, `blog/`, `ui/`)
- Data files: `src/lib/data/`
- Utilities: `src/lib/utils/`
- Blog posts: `src/lib/posts/*.md`
- Static assets: `static/`
- Types: `src/lib/types/`

## Code Style

- Use Svelte 5 runes exclusively. No `let x = writable()` or `$:` reactive statements.
- TypeScript everywhere. Define `interface Props` for component props.
- TailwindCSS classes in templates. No separate CSS files per component unless truly necessary.
- Use `$derived()` for computed values, not `$effect` with side effects.
- Prefer `onMount` for client-side initialization over `$effect` when there's no reactive dependency.

## Pre-commit Checks

Before committing, verify:

1. `pnpm check` passes (TypeScript + Svelte)
2. `pnpm build` succeeds (confirms SSG prerender works)
3. No `transition-all` in any file
4. No external font URLs in HTML or CSS
5. No heading level skips
6. All buttons have explicit `type` attribute
