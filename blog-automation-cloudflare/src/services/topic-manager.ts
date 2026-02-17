// ============================================
// Topic Manager Service (Edge-compatible)
// ============================================
//
// Generates, validates, and manages the topic queue
// using Claude for idea generation and D1 for storage.
//
// ============================================

import type { Env, PostCategory } from '../types/env';
import { ALL_CATEGORIES } from '../types/env';
import * as db from '../db/queries';
import { computeSimilarity, log } from '../utils/helpers';

// ── Public API ──────────────────────────────────────────────────────

/**
 * Picks the next topic from the queue, respecting category balance.
 * Auto-generates new topics if the queue is running low.
 */
export async function getNextTopic(
  env: Env,
  preferredCategory?: PostCategory,
): Promise<{ id: number; topic: string; category: PostCategory }> {
  // Check queue depth
  const stats = await db.getTopicQueueStats(env.DB);
  if (stats.unused < 10) {
    log('info', 'Topic queue low, generating new topics', { unused: stats.unused });
    await generateTopicIdeas(env, 20);
  }

  // Determine target category (least-represented)
  const category = preferredCategory ?? pickBalancedCategory(stats.byCategory);

  // Try target category first, then fall back to any
  let topic = await db.getNextTopic(env.DB, category);
  if (!topic) {
    topic = await db.getNextTopic(env.DB);
  }
  if (!topic) {
    throw new Error('Topic queue is empty — no unused topics available');
  }

  return {
    id: topic.id,
    topic: topic.topic,
    category: topic.category as PostCategory,
  };
}

/**
 * Generates topic ideas via Claude and inserts valid ones into the queue.
 */
export async function generateTopicIdeas(
  env: Env,
  count: number = 20,
): Promise<{ added: number; rejected: number }> {
  log('info', 'Generating topic ideas', { count });

  const stats = await db.getTopicQueueStats(env.DB);
  const existingTopics = await db.getExistingTopics(env.DB);

  // Call Claude for topics
  const raw = await callClaudeForTopics(env, count, stats.byCategory, existingTopics);
  const candidates = parseCandidates(raw);

  let added = 0;
  let rejected = 0;
  const toInsert: Array<{ topic: string; category: PostCategory; priority: number }> = [];

  for (const candidate of candidates) {
    // Validate
    if (!isValidTopic(candidate.topic, candidate.category, existingTopics)) {
      rejected++;
      continue;
    }

    // Calculate priority — boost under-represented categories
    const priority = calculatePriority(candidate.category, stats.byCategory);
    toInsert.push({ topic: candidate.topic, category: candidate.category, priority });
    existingTopics.push(candidate.topic); // Prevent intra-batch duplicates
    added++;
  }

  if (toInsert.length > 0) {
    await db.addTopicsBatch(env.DB, toInsert);
  }

  log('info', 'Topic generation complete', { added, rejected, candidates: candidates.length });
  return { added, rejected };
}

/**
 * Manually add topics to the queue.
 */
export async function addManualTopics(
  env: Env,
  topics: string[],
  category: PostCategory,
  priority: number = 0,
): Promise<{ added: number; skipped: number }> {
  const existing = await db.getExistingTopics(env.DB);
  let added = 0;
  let skipped = 0;

  for (const topicText of topics) {
    if (!isValidTopic(topicText, category, existing)) {
      skipped++;
      continue;
    }
    await db.addTopic(env.DB, topicText.trim(), category, priority);
    existing.push(topicText.trim());
    added++;
  }

  return { added, skipped };
}

// ── Validation ─────────────────────────────────────────────────────

function isValidTopic(topic: string, _category: PostCategory, existing: string[]): boolean {
  const trimmed = topic.trim();
  if (!trimmed) return false;

  const words = trimmed.split(/\s+/).length;
  if (words < 3 || words > 20) return false;

  // Relevance check
  if (!isRelevantToFrontend(trimmed)) return false;

  // Similarity check
  for (const ex of existing) {
    if (computeSimilarity(trimmed, ex) >= 0.6) return false;
  }

  return true;
}

function isRelevantToFrontend(topic: string): boolean {
  const lower = topic.toLowerCase();
  const keywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'svelte',
    'next.js', 'nextjs', 'nuxt', 'astro', 'remix', 'gatsby',
    'css', 'sass', 'tailwind', 'html', 'dom', 'browser', 'web',
    'frontend', 'front-end', 'component', 'hook', 'state', 'redux',
    'webpack', 'vite', 'esbuild', 'rollup', 'bundl', 'node', 'npm',
    'api', 'rest', 'graphql', 'fetch', 'testing', 'jest', 'vitest',
    'performance', 'accessibility', 'a11y', 'seo', 'animation',
    'promise', 'async', 'await', 'event loop', 'closure', 'prototype',
    'type', 'interface', 'generic', 'enum', 'decorator', 'pattern',
    'ssr', 'ssg', 'csr', 'hydration', 'rendering', 'responsive',
    'pwa', 'service worker', 'websocket', 'canvas', 'svg',
  ];
  return keywords.some((kw) => lower.includes(kw));
}

// ── Priority ───────────────────────────────────────────────────────

function calculatePriority(
  category: PostCategory,
  currentCounts: Record<PostCategory, number>,
): number {
  const total = Object.values(currentCounts).reduce((a, b) => a + b, 0);
  const ideal = total > 0 ? total / ALL_CATEGORIES.length : 0;
  const current = currentCounts[category] || 0;

  let priority = 5;
  if (ideal > 0 && current < ideal) {
    priority += Math.min(Math.round(ideal - current), 5);
  }
  return priority;
}

function pickBalancedCategory(counts: Record<PostCategory, number>): PostCategory {
  let min: PostCategory = 'JAVASCRIPT';
  let minCount = Infinity;

  for (const cat of ALL_CATEGORIES) {
    if (counts[cat] < minCount) {
      minCount = counts[cat];
      min = cat;
    }
  }

  return min;
}

// ── Claude Integration ─────────────────────────────────────────────

async function callClaudeForTopics(
  env: Env,
  count: number,
  categoryBalance: Record<PostCategory, number>,
  existingTopics: string[],
): Promise<string> {
  const balance = ALL_CATEGORIES.map((c) => `${c}: ${categoryBalance[c]} unused`).join(', ');
  const existing = existingTopics.slice(0, 30).map((t) => `- ${t}`).join('\n');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.9,
      system: `You are a frontend engineering content strategist. Generate unique, specific blog topics.\n\nCategories: JAVASCRIPT, TYPESCRIPT, FRONTEND\n\nRespond with JSON: {"topics":[{"topic":"...","category":"JAVASCRIPT|TYPESCRIPT|FRONTEND"}]}`,
      messages: [{
        role: 'user',
        content: `Generate ${count} unique blog topics.\n\nCurrent balance: ${balance}\nGenerate more for under-represented categories.\n\n${existing ? `Existing topics (avoid duplicates):\n${existing}` : ''}`,
      }],
    }),
  });

  if (!resp.ok) throw new Error(`Claude API error: ${resp.status}`);

  const data = await resp.json() as { content: Array<{ type: string; text: string }> };
  return data.content.find((b) => b.type === 'text')?.text || '';
}

function parseCandidates(raw: string): Array<{ topic: string; category: PostCategory }> {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as { topics?: Array<{ topic?: string; category?: string }> };
    if (!Array.isArray(parsed.topics)) return [];

    return parsed.topics
      .filter((t): t is { topic: string; category: string } => !!t.topic && typeof t.topic === 'string')
      .map((t) => ({
        topic: t.topic.trim(),
        category: (ALL_CATEGORIES.includes(t.category?.toUpperCase() as PostCategory)
          ? t.category!.toUpperCase()
          : 'FRONTEND') as PostCategory,
      }));
  } catch {
    log('error', 'Failed to parse topic candidates');
    return [];
  }
}
