// ============================================
// KV Cache Layer
// ============================================
//
// Uses Cloudflare KV for caching frequently
// accessed data to reduce D1 reads:
//   - Generated content (24h TTL)
//   - Topic queue stats (5min TTL)
//   - Status dashboard (1min TTL)
//
// ============================================

import type { Env, GeneratedContent } from '../types/env';

const TTL = {
  CONTENT: 86400,      // 24 hours
  STATS: 300,          // 5 minutes
  DASHBOARD: 60,       // 1 minute
  TOPIC_LIST: 600,     // 10 minutes
};

// ── Content Cache ───────────────────────────────────────────────────

export async function cacheContent(
  env: Env,
  blogId: number,
  content: GeneratedContent,
): Promise<void> {
  const key = `blog:${blogId}`;
  await env.CACHE.put(key, JSON.stringify(content), { expirationTtl: TTL.CONTENT });
}

export async function getCachedContent(
  env: Env,
  blogId: number,
): Promise<GeneratedContent | null> {
  const key = `blog:${blogId}`;
  const cached = await env.CACHE.get(key);
  return cached ? JSON.parse(cached) : null;
}

// ── Stats Cache ─────────────────────────────────────────────────────

export async function cacheStats(env: Env, key: string, data: unknown): Promise<void> {
  await env.CACHE.put(`stats:${key}`, JSON.stringify(data), { expirationTtl: TTL.STATS });
}

export async function getCachedStats(env: Env, key: string): Promise<unknown | null> {
  const cached = await env.CACHE.get(`stats:${key}`);
  return cached ? JSON.parse(cached) : null;
}

// ── Dashboard Cache ─────────────────────────────────────────────────

export async function cacheDashboard(env: Env, data: unknown): Promise<void> {
  await env.CACHE.put('dashboard', JSON.stringify(data), { expirationTtl: TTL.DASHBOARD });
}

export async function getCachedDashboard(env: Env): Promise<unknown | null> {
  const cached = await env.CACHE.get('dashboard');
  return cached ? JSON.parse(cached) : null;
}

// ── Rate Limiting ───────────────────────────────────────────────────

/**
 * Simple rate limiter using KV.
 * Returns true if the action should be allowed, false if rate limited.
 */
export async function checkRateLimit(
  env: Env,
  key: string,
  maxPerWindow: number,
  windowSeconds: number,
): Promise<boolean> {
  const kvKey = `ratelimit:${key}`;
  const existing = await env.CACHE.get(kvKey);
  const count = existing ? parseInt(existing) : 0;

  if (count >= maxPerWindow) return false;

  await env.CACHE.put(kvKey, String(count + 1), { expirationTtl: windowSeconds });
  return true;
}

// ── Cache Management ────────────────────────────────────────────────

export async function getCacheStats(env: Env): Promise<{
  note: string;
}> {
  // KV doesn't expose stats directly; return info about the cache strategy
  return {
    note: 'KV cache is active. TTLs: content=24h, stats=5min, dashboard=1min.',
  };
}

export async function invalidateContent(env: Env, blogId: number): Promise<void> {
  await env.CACHE.delete(`blog:${blogId}`);
}

export async function invalidateAll(env: Env): Promise<void> {
  // KV doesn't support bulk delete; entries expire naturally via TTL
  await env.CACHE.delete('dashboard');
}
