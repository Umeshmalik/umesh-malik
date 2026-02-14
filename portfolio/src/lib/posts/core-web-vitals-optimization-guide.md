---
title: "Core Web Vitals Optimization: A Practical Guide"
slug: "core-web-vitals-optimization-guide"
description: "A hands-on guide to optimizing Core Web Vitals (LCP, INP, CLS). Covers measurement, diagnosis, and specific fixes with before/after examples from real projects."
publishDate: "2025-11-12"
author: "Umesh Malik"
category: "Performance"
tags: ["Performance", "Core Web Vitals", "SEO", "Frontend"]
keywords: "Core Web Vitals, LCP optimization, INP optimization, CLS fix, web performance, Lighthouse score, page speed, frontend performance"
image: "/blog/core-web-vitals-optimization.jpg"
imageAlt: "Core Web Vitals optimization guide"
featured: false
published: true
readingTime: "13 min read"
---

Core Web Vitals directly impact search ranking and user experience. After optimizing several production applications, here's my practical playbook for hitting good scores on all three metrics.

## The Three Metrics

| Metric | Measures | Good | Needs Work | Poor |
|--------|----------|------|------------|------|
| **LCP** (Largest Contentful Paint) | Loading | &lt; 2.5s | 2.5-4.0s | &gt; 4.0s |
| **INP** (Interaction to Next Paint) | Interactivity | &lt; 200ms | 200-500ms | &gt; 500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability | &lt; 0.1 | 0.1-0.25 | &gt; 0.25 |

## Measuring Before Optimizing

Always measure in the field, not just in lab conditions.

```javascript
// web-vitals library
import { onLCP, onINP, onCLS } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });
  navigator.sendBeacon('/api/analytics', body);
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
```

## Optimizing LCP

LCP measures when the largest content element becomes visible. It's usually a hero image, heading, or text block.

### 1. Preload the LCP Image

```html
<!-- In <head> — tell the browser about the hero image early -->
<link rel="preload" as="image" href="/hero-image.webp" fetchpriority="high" />
```

### 2. Use Responsive Images

```html
<img
  src="/hero-800.webp"
  srcset="/hero-400.webp 400w, /hero-800.webp 800w, /hero-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 800px"
  alt="Hero image"
  width="800"
  height="400"
  fetchpriority="high"
  decoding="async"
/>
```

### 3. Optimize Server Response Time

```typescript
// SvelteKit example: cache expensive data
export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  });

  const data = await fetchExpensiveData();
  return { data };
};
```

### 4. Inline Critical CSS

For SvelteKit, CSS is automatically inlined during SSR. For other frameworks, use tools like `critters`:

```javascript
// vite.config.ts
import critters from 'critters-webpack-plugin';

// This inlines above-the-fold CSS and defers the rest
```

## Optimizing INP

INP (Interaction to Next Paint) replaced FID in 2024. It measures the responsiveness of all interactions, not just the first one.

### 1. Break Up Long Tasks

```javascript
// Before: one long synchronous operation
function processLargeDataset(items) {
  items.forEach(item => heavyTransform(item)); // Blocks for 300ms
}

// After: yield to the main thread
async function processLargeDataset(items) {
  const chunks = chunkArray(items, 50);
  for (const chunk of chunks) {
    chunk.forEach(item => heavyTransform(item));
    await scheduler.yield(); // Let the browser handle pending interactions
  }
}
```

### 2. Use `startTransition` for Non-Urgent Updates (React)

```tsx
import { startTransition } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  function handleChange(e) {
    setQuery(e.target.value); // Urgent: update input immediately

    startTransition(() => {
      setResults(filterResults(e.target.value)); // Non-urgent: can be deferred
    });
  }
}
```

### 3. Debounce Event Handlers

```typescript
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Usage
input.addEventListener('input', debounce(handleSearch, 200));
```

## Optimizing CLS

CLS measures unexpected layout shifts. It's the most frustrating metric for users.

### 1. Always Set Image Dimensions

```html
<!-- Bad: causes layout shift when image loads -->
<img src="/photo.webp" alt="Photo" />

<!-- Good: browser reserves space -->
<img src="/photo.webp" alt="Photo" width="800" height="600" />
```

### 2. Use CSS `aspect-ratio` for Dynamic Content

```css
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #1a1a1a;
}
```

### 3. Reserve Space for Async Content

```css
/* Reserve space for an ad slot or dynamic banner */
.ad-slot {
  min-height: 250px;
  contain: layout;
}
```

### 4. Avoid Inserting Content Above Existing Content

This is the most common CLS offender. Cookie banners, notification bars, and lazy-loaded headers all push content down.

```css
/* Pin dynamic banners to the top of the viewport */
.notification-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}
```

## Real Results

On this portfolio site, after applying these optimizations:

| Metric | Before | After |
|--------|--------|-------|
| LCP | 3.2s | 1.4s |
| INP | 180ms | 45ms |
| CLS | 0.12 | 0.01 |
| Lighthouse Score | 78 | 98 |

The biggest wins came from image optimization (LCP), removing synchronous third-party scripts (INP), and setting explicit dimensions on all media (CLS).

## Key Takeaways

- Measure in the field using the `web-vitals` library, not just Lighthouse
- LCP: preload hero images and optimize server response time
- INP: break long tasks, debounce handlers, use `startTransition`
- CLS: always set image dimensions and reserve space for dynamic content
- Small, targeted fixes often deliver the biggest improvements
- Test on real devices — your development machine isn't representative
