---
title: "TailwindCSS v4 Migration Guide: What Changed and How to Upgrade"
slug: "tailwindcss-v4-migration-guide"
description: "A practical guide to migrating from TailwindCSS v3 to v4. Covers the new CSS-first configuration, updated color system, removed utilities, and step-by-step upgrade path."
publishDate: "2025-05-20"
author: "Umesh Malik"
category: "CSS"
tags: ["TailwindCSS", "CSS", "Frontend", "Migration"]
keywords: "TailwindCSS v4, Tailwind migration, CSS-first config, TailwindCSS upgrade, Tailwind v3 to v4, TailwindCSS 4 changes"
image: "/blog/tailwindcss-v4-cover.svg"
imageAlt: "TailwindCSS v4 migration showing the shift from JavaScript config to CSS-first @theme configuration"
featured: false
published: true
readingTime: "12 min read"
---

I migrated this portfolio from TailwindCSS v3 to v4, and the upgrade was smoother than expected — but there are breaking changes you need to know about. Here's what I learned.

## The Big Shift: CSS-First Configuration

The biggest change in Tailwind v4 is that configuration moves from `tailwind.config.js` into your CSS file using `@theme`.

### Before (v3)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          accent: '#C09E5A',
          black: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

### After (v4)

```css
/* app.css */
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --color-brand-accent: #C09E5A;
  --color-brand-black: #000000;
}
```

This is a significant philosophical change. Your design tokens are now CSS custom properties, which means:
- They're inspectable in browser DevTools
- They work with native CSS features like `color-mix()`
- No build step needed to read your config values

## Step-by-Step Migration

### 1. Update Dependencies

```bash
pnpm remove tailwindcss postcss autoprefixer
pnpm add tailwindcss@latest @tailwindcss/vite
```

In v4, Tailwind runs as a Vite plugin instead of PostCSS. Update your `vite.config.ts`:

```typescript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

### 2. Remove Old Config Files

Delete these if they exist:
- `tailwind.config.js` / `tailwind.config.ts`
- `postcss.config.js` (if only used for Tailwind)

### 3. Update Your CSS Entry Point

Replace the old directives:

```css
/* Before */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After */
@import 'tailwindcss';
```

### 4. Migrate Theme Config to @theme

Move your `tailwind.config.js` theme values into `@theme` blocks in your CSS:

```css
@theme {
  --font-display: 'Inter', system-ui, sans-serif;
  --color-brand-accent: #C09E5A;
  --color-brand-border: #2B2B2B;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
}
```

### 5. Update Plugin Usage

```css
/* Before: require() in config */
/* After: @plugin directive in CSS */
@plugin '@tailwindcss/typography';
```

## Breaking Changes to Watch For

### Renamed Utilities

Several utility classes were renamed for consistency:

| v3 | v4 |
|----|-----|
| `bg-opacity-50` | `bg-black/50` (opacity modifier) |
| `text-opacity-75` | `text-white/75` |
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `ring` | `ring-3` |
| `blur` | `blur-sm` |

### Removed Features

- **`@apply` with `!important`**: Use `@utility` instead for custom utilities
- **`theme()` function in CSS**: Replaced by native CSS custom properties (`var(--color-brand-accent)`)
- **`safelist` config**: Not needed — v4's detection is more thorough
- **`darkMode` config**: Always uses `@media (prefers-color-scheme: dark)` or class strategy via CSS

### Default Border Color Changed

In v3, `border` defaulted to `gray-200`. In v4, it defaults to `currentColor`. Add explicit colors:

```html
<!-- Before (v3) -->
<div class="border">...</div>

<!-- After (v4) — add explicit color -->
<div class="border border-gray-200">...</div>
```

## Container Queries

Tailwind v4 has first-class container query support:

```html
<div class="@container">
  <div class="@sm:flex @md:grid @md:grid-cols-2">
    <!-- Responds to container size, not viewport -->
  </div>
</div>
```

## New Color System

The default color palette uses OKLCH color space, which provides more perceptually uniform colors. If you're using custom colors, they'll still work fine.

## Automated Migration

Tailwind provides a codemod to automate most of the migration:

```bash
npx @tailwindcss/upgrade
```

This handles renaming utilities, updating imports, and converting your config. I'd still recommend reviewing the diff manually — the codemod caught about 90% of changes in my case.

## Performance Improvements

v4 is significantly faster:
- **Build times**: Up to 10x faster full builds
- **Incremental builds**: Up to 100x faster during development
- **Bundle size**: Smaller CSS output thanks to better dead-code elimination

In this portfolio, the CSS bundle dropped from 28KB to 19KB after migration — a 32% reduction with zero visual changes.

## Key Takeaways

- The CSS-first approach is the biggest mental shift — embrace it
- Use the automated migration tool, but review the output
- Update border utilities to include explicit colors
- Shadow and blur class names have shifted — check your components
- The performance improvements alone make the upgrade worthwhile
- Container queries are now trivial to use
