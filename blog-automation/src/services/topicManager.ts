// ============================================
// Topic Manager — Queue & Idea Generation
// ============================================
//
// Manages the TopicQueue: generating AI-powered topic ideas,
// validating them for uniqueness and relevance, maintaining
// a healthy queue depth (≥ 30 unused), and rotating categories
// to ensure balanced content distribution.
//
// Features:
//   - Claude-powered topic generation (diverse, timely, specific)
//   - Similarity detection against existing topics and recent posts
//   - Category rotation (round-robin JS → TS → FRONTEND)
//   - Auto-refresh when the unused queue drops below threshold
//   - Priority scoring based on category balance need
//   - Full logging and error recovery
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { createServiceLogger } from '../config/logger';
import prisma from '../database/client';
import { sleep } from '../utils/helpers';
import {
  Topic,
  TopicCategory,
  TopicManagerConfig,
  TopicValidationResult,
  TopicGenerationResult,
  TopicQueueStats,
  ALL_CATEGORIES,
} from '../types';

const logger = createServiceLogger('topic-manager');

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_CONFIG: TopicManagerConfig = {
  minQueueSize: 30,
  lowQueueThreshold: 10,
  topicsPerGeneration: 20,
  claudeModel: config.ai.model,
  maxTokens: 4096,
  rateLimitMs: 1000,
  maxRetries: 3,
  similarityThreshold: 0.6,
};

/** Category rotation order */
const CATEGORY_ROTATION: readonly TopicCategory[] = ALL_CATEGORIES;

/** Minimum word count for a valid topic string */
const MIN_TOPIC_WORDS = 3;

/** Maximum word count for a valid topic string */
const MAX_TOPIC_WORDS = 20;

/** Recent posts window: how far back to look for similarity checks */
const RECENT_POSTS_DAYS = 90;

// ── TopicManager Class ──────────────────────────────────────────────

export class TopicManager {
  private readonly anthropic: Anthropic;
  private readonly cfg: TopicManagerConfig;
  private lastApiCallAt = 0;
  private rotationIndex = 0;
  private isRefreshing = false;

  constructor(overrides?: Partial<TopicManagerConfig>) {
    this.cfg = { ...DEFAULT_CONFIG, ...overrides };
    this.anthropic = new Anthropic({ apiKey: config.ai.apiKey });

    logger.info('TopicManager initialized', {
      minQueueSize: this.cfg.minQueueSize,
      lowQueueThreshold: this.cfg.lowQueueThreshold,
      topicsPerGeneration: this.cfg.topicsPerGeneration,
      similarityThreshold: this.cfg.similarityThreshold,
    });
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Returns the next unused topic from the queue.
   *
   * - If `category` is provided, returns the highest-priority unused
   *   topic in that category.
   * - If `category` is omitted, uses category rotation to pick the
   *   category with the fewest recent posts (balanced distribution).
   * - Triggers auto-refresh if the unused queue is below threshold.
   *
   * @throws Error if no unused topics exist (even after refresh attempt)
   */
  async getNextTopic(category?: TopicCategory): Promise<Topic> {
    // Auto-refresh check (non-blocking — kicks off in background)
    await this.autoRefreshIfNeeded();

    // Resolve category via rotation if not provided
    const targetCategory = category ?? await this.getNextRotationCategory();

    logger.info('Fetching next topic', { targetCategory });

    // Try the target category first
    let record = await prisma.topicQueue.findFirst({
      where: { used: false, category: targetCategory },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    // Fallback: if target category is empty, try any category
    if (!record) {
      logger.warn('No topics in target category — falling back to any', { targetCategory });
      record = await prisma.topicQueue.findFirst({
        where: { used: false },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    }

    if (!record) {
      throw new Error('Topic queue is empty — no unused topics available');
    }

    logger.info('Topic selected', {
      topicId: record.id,
      topic: record.topic,
      category: record.category,
      priority: record.priority,
    });

    return this.toTopic(record);
  }

  /**
   * Bulk-adds manually specified topics to the queue.
   * Each topic is validated and de-duplicated before insertion.
   */
  async addTopics(
    topics: string[],
    category: TopicCategory,
    priority: number = 0,
  ): Promise<void> {
    logger.info('Adding manual topics', { count: topics.length, category });

    let added = 0;
    let skipped = 0;

    for (const topicText of topics) {
      const validation = await this.validateTopic(topicText, category);

      if (!validation.isValid) {
        logger.debug('Manual topic rejected', {
          topic: topicText,
          reasons: validation.rejectionReasons,
        });
        skipped++;
        continue;
      }

      await prisma.topicQueue.create({
        data: {
          topic: topicText.trim(),
          category,
          priority,
        },
      });

      added++;
    }

    logger.info('Manual topics added', { added, skipped, total: topics.length });
  }

  /**
   * Generates new topic ideas using Claude API and inserts valid
   * ones into the queue. Returns a detailed generation report.
   *
   * Topics are spread across categories using round-robin, with
   * priority scores boosted for under-represented categories.
   */
  async generateTopicIdeas(count: number = this.cfg.topicsPerGeneration): Promise<TopicGenerationResult> {
    const startTime = Date.now();

    logger.info('Generating topic ideas', { count });

    // Gather context for the prompt
    const stats = await this.getQueueStats();
    const recentPostTitles = await this.getRecentPostTitles();
    const existingTopics = await this.getExistingUnusedTopics();

    // Build and call Claude
    const raw = await this.callClaudeForTopics(
      count,
      stats.unusedByCategory,
      recentPostTitles,
      existingTopics,
    );

    // Parse Claude's response into candidate topic objects
    const candidates = this.parseCandidates(raw);

    logger.info('Claude returned candidates', { candidateCount: candidates.length });

    // Validate, de-duplicate, and insert
    const added: Topic[] = [];
    const rejected: Array<{ topic: string; reason: string }> = [];

    for (const candidate of candidates) {
      const category = candidate.category;
      const validation = await this.validateTopic(candidate.topic, category);

      if (!validation.isValid) {
        rejected.push({
          topic: candidate.topic,
          reason: validation.rejectionReasons.join('; '),
        });
        continue;
      }

      // Calculate priority: boost under-represented categories
      const priority = this.calculatePriority(category, stats.unusedByCategory);

      const record = await prisma.topicQueue.create({
        data: {
          topic: candidate.topic.trim(),
          category,
          priority,
        },
      });

      added.push(this.toTopic(record));
    }

    // Build category breakdown
    const categoryBreakdown = { JAVASCRIPT: 0, TYPESCRIPT: 0, FRONTEND: 0 };
    for (const t of added) {
      categoryBreakdown[t.category]++;
    }

    const durationMs = Date.now() - startTime;

    logger.info('Topic generation complete', {
      candidateCount: candidates.length,
      added: added.length,
      rejected: rejected.length,
      categoryBreakdown,
      durationMs,
    });

    return {
      added,
      rejected,
      candidateCount: candidates.length,
      categoryBreakdown,
    };
  }

  /**
   * Marks a topic as used in the queue.
   */
  async markTopicAsUsed(topicId: string): Promise<void> {
    await prisma.topicQueue.update({
      where: { id: topicId },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    logger.info('Topic marked as used', { topicId });

    // Advance category rotation
    const topic = await prisma.topicQueue.findUnique({ where: { id: topicId } });
    if (topic) {
      const idx = CATEGORY_ROTATION.indexOf(topic.category as TopicCategory);
      if (idx >= 0) {
        this.rotationIndex = (idx + 1) % CATEGORY_ROTATION.length;
      }
    }
  }

  /**
   * Ensures the queue has at least `minQueueSize` unused topics.
   * Generates new topics in batches until the target is met.
   */
  async refreshTopicQueue(): Promise<void> {
    if (this.isRefreshing) {
      logger.debug('Refresh already in progress — skipping');
      return;
    }

    this.isRefreshing = true;

    try {
      const stats = await this.getQueueStats();

      if (stats.unused >= this.cfg.minQueueSize) {
        logger.info('Queue is healthy — no refresh needed', {
          unused: stats.unused,
          minRequired: this.cfg.minQueueSize,
        });
        return;
      }

      const deficit = this.cfg.minQueueSize - stats.unused;
      logger.info('Refreshing topic queue', {
        current: stats.unused,
        target: this.cfg.minQueueSize,
        deficit,
      });

      // Generate in batches of topicsPerGeneration until deficit is met
      let totalAdded = 0;
      let batches = 0;
      const maxBatches = 5; // Safety limit

      while (totalAdded < deficit && batches < maxBatches) {
        const batchSize = Math.min(
          this.cfg.topicsPerGeneration,
          deficit - totalAdded + 5, // ask for a few extra to cover rejections
        );

        const result = await this.generateTopicIdeas(batchSize);
        totalAdded += result.added.length;
        batches++;

        logger.info('Refresh batch complete', {
          batch: batches,
          added: result.added.length,
          totalAdded,
          remaining: Math.max(0, deficit - totalAdded),
        });

        // Small delay between batches
        if (totalAdded < deficit && batches < maxBatches) {
          await sleep(2000);
        }
      }

      logger.info('Topic queue refresh complete', {
        totalAdded,
        batches,
        newTotal: stats.unused + totalAdded,
      });
    } finally {
      this.isRefreshing = false;
    }
  }

  // ── Queue Statistics ──────────────────────────────────────────────

  /**
   * Returns a snapshot of the queue's current state.
   */
  async getQueueStats(): Promise<TopicQueueStats> {
    const [total, unused, jsCnt, tsCnt, feCnt] = await Promise.all([
      prisma.topicQueue.count(),
      prisma.topicQueue.count({ where: { used: false } }),
      prisma.topicQueue.count({ where: { used: false, category: 'JAVASCRIPT' } }),
      prisma.topicQueue.count({ where: { used: false, category: 'TYPESCRIPT' } }),
      prisma.topicQueue.count({ where: { used: false, category: 'FRONTEND' } }),
    ]);

    return {
      total,
      unused,
      used: total - unused,
      unusedByCategory: {
        JAVASCRIPT: jsCnt,
        TYPESCRIPT: tsCnt,
        FRONTEND: feCnt,
      },
      needsRefresh: unused < this.cfg.lowQueueThreshold,
    };
  }

  // ── Private: Auto-Refresh ─────────────────────────────────────────

  /**
   * Checks the queue depth and triggers a background refresh if
   * unused topics have dropped below the low-queue threshold.
   */
  private async autoRefreshIfNeeded(): Promise<void> {
    const unused = await prisma.topicQueue.count({ where: { used: false } });

    if (unused < this.cfg.lowQueueThreshold) {
      logger.info('Queue is low — auto-refreshing', {
        unused,
        threshold: this.cfg.lowQueueThreshold,
      });

      // Run in background — don't block the caller
      this.refreshTopicQueue().catch((error) => {
        logger.error('Auto-refresh failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }

  // ── Private: Category Rotation ────────────────────────────────────

  /**
   * Determines the next category to use for balanced distribution.
   *
   * Strategy:
   *   1. Look at unused-topic counts per category
   *   2. If one category has significantly fewer recent posts, prefer it
   *   3. Otherwise, use simple round-robin
   */
  private async getNextRotationCategory(): Promise<TopicCategory> {
    // Count recent posts per category (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPosts = await prisma.blogPost.groupBy({
      by: ['category'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    });

    const postCounts: Record<string, number> = {};
    for (const cat of ALL_CATEGORIES) {
      postCounts[cat] = 0;
    }
    for (const row of recentPosts) {
      postCounts[row.category] = row._count.id;
    }

    // Find the category with the fewest recent posts
    let minCategory: TopicCategory = CATEGORY_ROTATION[this.rotationIndex];
    let minCount = Infinity;

    for (const cat of ALL_CATEGORIES) {
      if (postCounts[cat] < minCount) {
        minCount = postCounts[cat];
        minCategory = cat;
      }
    }

    // If all categories are tied, use round-robin
    const allEqual = ALL_CATEGORIES.every((c) => postCounts[c] === minCount);
    if (allEqual) {
      minCategory = CATEGORY_ROTATION[this.rotationIndex];
      this.rotationIndex = (this.rotationIndex + 1) % CATEGORY_ROTATION.length;
    }

    logger.debug('Category rotation resolved', {
      selected: minCategory,
      recentPostCounts: postCounts,
      rotationIndex: this.rotationIndex,
    });

    return minCategory;
  }

  // ── Private: Topic Validation ─────────────────────────────────────

  /**
   * Validates a topic candidate against multiple criteria:
   *   1. Not empty / too short / too long
   *   2. Relevant to frontend engineering
   *   3. Not too similar to existing unused topics
   *   4. Not too similar to recently published posts
   */
  private async validateTopic(
    topicText: string,
    _category: TopicCategory,
  ): Promise<TopicValidationResult> {
    const reasons: string[] = [];
    const normalized = topicText.trim();

    // 1. Basic length checks
    if (!normalized) {
      reasons.push('Topic is empty');
      return { isValid: false, topic: normalized, rejectionReasons: reasons };
    }

    const wordCount = normalized.split(/\s+/).length;
    if (wordCount < MIN_TOPIC_WORDS) {
      reasons.push(`Too short: ${wordCount} words (minimum ${MIN_TOPIC_WORDS})`);
    }
    if (wordCount > MAX_TOPIC_WORDS) {
      reasons.push(`Too long: ${wordCount} words (maximum ${MAX_TOPIC_WORDS})`);
    }

    // 2. Relevance check — must contain at least one tech keyword
    if (!this.isRelevantToFrontend(normalized)) {
      reasons.push('Not relevant to frontend engineering');
    }

    // 3. Similarity against existing unused topics
    const existingTopics = await this.getExistingUnusedTopics();
    for (const existing of existingTopics) {
      const similarity = this.computeSimilarity(normalized, existing);
      if (similarity >= this.cfg.similarityThreshold) {
        reasons.push(`Too similar to existing topic: "${existing}" (similarity: ${similarity.toFixed(2)})`);
        break; // One match is enough to reject
      }
    }

    // 4. Similarity against recent post titles
    const recentTitles = await this.getRecentPostTitles();
    for (const title of recentTitles) {
      const similarity = this.computeSimilarity(normalized, title);
      if (similarity >= this.cfg.similarityThreshold) {
        reasons.push(`Too similar to recent post: "${title}" (similarity: ${similarity.toFixed(2)})`);
        break;
      }
    }

    return {
      isValid: reasons.length === 0,
      topic: normalized,
      rejectionReasons: reasons,
    };
  }

  /**
   * Checks whether a topic string is plausibly about frontend
   * engineering. Uses a keyword-matching heuristic.
   */
  private isRelevantToFrontend(topic: string): boolean {
    const lower = topic.toLowerCase();

    const frontendKeywords = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'svelte',
      'next.js', 'nextjs', 'nuxt', 'astro', 'remix', 'gatsby',
      'css', 'sass', 'tailwind', 'styled-components', 'html',
      'dom', 'browser', 'web', 'frontend', 'front-end', 'front end',
      'component', 'hook', 'state', 'redux', 'zustand', 'mobx',
      'webpack', 'vite', 'esbuild', 'rollup', 'bundl',
      'node', 'npm', 'pnpm', 'yarn', 'deno', 'bun',
      'api', 'rest', 'graphql', 'fetch', 'axios',
      'testing', 'jest', 'vitest', 'playwright', 'cypress',
      'performance', 'accessibility', 'a11y', 'seo',
      'animation', 'canvas', 'svg', 'webgl', 'three.js',
      'pwa', 'service worker', 'websocket',
      'promise', 'async', 'await', 'event loop',
      'closure', 'prototype', 'class', 'module', 'import', 'export',
      'type', 'interface', 'generic', 'enum', 'decorator',
      'pattern', 'architecture', 'micro-frontend', 'monorepo',
      'ssr', 'ssg', 'csr', 'isr', 'hydration', 'rendering',
      'responsive', 'mobile', 'layout', 'grid', 'flexbox',
    ];

    return frontendKeywords.some((kw) => lower.includes(kw));
  }

  /**
   * Computes Jaccard similarity between two strings based on
   * word-level tokens. Returns a value between 0 (no overlap) and
   * 1 (identical token sets).
   */
  private computeSimilarity(a: string, b: string): number {
    const tokensA = this.tokenize(a);
    const tokensB = this.tokenize(b);

    if (tokensA.size === 0 && tokensB.size === 0) return 1;
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) intersection++;
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Tokenizes a string into a Set of normalized, meaningful words.
   * Strips stop words, lowercases, and removes short tokens.
   */
  private tokenize(text: string): Set<string> {
    const stopWords = new Set([
      'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'not', 'no', 'nor', 'so', 'if', 'then', 'than', 'too', 'very',
      'just', 'about', 'above', 'after', 'before', 'between', 'into',
      'through', 'during', 'up', 'down', 'out', 'off', 'over', 'under',
      'again', 'further', 'once', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'only', 'own', 'same', 'that',
      'this', 'these', 'those', 'what', 'which', 'who', 'whom',
      'your', 'its', 'my', 'our', 'their', 'using', 'use',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s.-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));

    return new Set(words);
  }

  // ── Private: Priority Scoring ─────────────────────────────────────

  /**
   * Calculates a priority score for a new topic.
   * Under-represented categories get a boost.
   */
  private calculatePriority(
    category: TopicCategory,
    currentCounts: Record<TopicCategory, number>,
  ): number {
    const total = Object.values(currentCounts).reduce((a, b) => a + b, 0);
    const idealPerCategory = total > 0 ? total / ALL_CATEGORIES.length : 0;
    const currentCount = currentCounts[category] || 0;

    // Base priority
    let priority = 5;

    // Boost if this category is under-represented
    if (idealPerCategory > 0 && currentCount < idealPerCategory) {
      const deficit = idealPerCategory - currentCount;
      priority += Math.min(Math.round(deficit), 5);
    }

    return priority;
  }

  // ── Private: Data Fetching ────────────────────────────────────────

  /**
   * Returns all unused topic strings from the queue.
   */
  private async getExistingUnusedTopics(): Promise<string[]> {
    const records = await prisma.topicQueue.findMany({
      where: { used: false },
      select: { topic: true },
    });
    return records.map((r) => r.topic);
  }

  /**
   * Returns titles of recently published or drafted blog posts.
   */
  private async getRecentPostTitles(): Promise<string[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_POSTS_DAYS);

    const posts = await prisma.blogPost.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return posts.map((p) => p.title);
  }

  // ── Private: Claude Integration ───────────────────────────────────

  /**
   * Calls Claude to generate topic ideas, incorporating context
   * about the current queue state and recent posts to avoid dupes.
   */
  private async callClaudeForTopics(
    count: number,
    unusedByCategory: Record<TopicCategory, number>,
    recentPostTitles: string[],
    existingTopics: string[],
  ): Promise<string> {
    const systemPrompt = this.buildTopicSystemPrompt();
    const userPrompt = this.buildTopicUserPrompt(
      count,
      unusedByCategory,
      recentPostTitles,
      existingTopics,
    );

    return this.callClaude(systemPrompt, userPrompt);
  }

  /**
   * System prompt for topic generation.
   */
  private buildTopicSystemPrompt(): string {
    return `You are a senior frontend engineering content strategist. Your job is to generate unique, specific blog post topics for a technical blog targeting intermediate to advanced developers.

TOPIC QUALITY GUIDELINES:
- Each topic must be specific enough to write a 1500-2500 word blog post
- Focus on practical, actionable content — not vague overviews
- Include specific technology versions, patterns, or techniques when applicable
- Mix evergreen fundamentals with current trends
- Topics should teach something concrete — "how to", "deep dive", "patterns", "optimization"

CATEGORY DEFINITIONS:
- JAVASCRIPT: Core JS language features, ES2024+, runtime concepts, Node.js, Deno, Bun
- TYPESCRIPT: Type system, generics, utility types, TS-specific patterns, compiler features
- FRONTEND: React, Vue, Angular, Svelte, Next.js, CSS, bundlers, testing, architecture, performance, accessibility

RESPONSE FORMAT — respond with valid JSON only (no markdown fences):
{
  "topics": [
    { "topic": "Topic title here", "category": "JAVASCRIPT" },
    { "topic": "Another topic", "category": "TYPESCRIPT" },
    ...
  ]
}`;
  }

  /**
   * User prompt with context about current queue state and
   * instructions for balanced generation.
   */
  private buildTopicUserPrompt(
    count: number,
    unusedByCategory: Record<TopicCategory, number>,
    recentPostTitles: string[],
    existingTopics: string[],
  ): string {
    const parts: string[] = [];

    parts.push(
      `Generate ${count} unique, specific blog post topics for a frontend engineering blog.`,
      `Focus on JavaScript, TypeScript, and modern frontend frameworks.`,
      `Topics should be practical, current, and valuable for intermediate to advanced developers.`,
    );

    // Category balance guidance
    const total = Object.values(unusedByCategory).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const breakdown = ALL_CATEGORIES.map(
        (c) => `${c}: ${unusedByCategory[c]} unused`,
      ).join(', ');
      parts.push(
        `\nCurrent queue balance: ${breakdown}`,
        `Generate more topics for under-represented categories to maintain balance.`,
      );
    }

    // Avoid duplicates
    if (existingTopics.length > 0) {
      const sample = existingTopics.slice(0, 30).map((t) => `- ${t}`).join('\n');
      parts.push(
        `\nExisting topics in queue (DO NOT duplicate or create very similar topics):\n${sample}`,
      );
    }

    if (recentPostTitles.length > 0) {
      const sample = recentPostTitles.slice(0, 20).map((t) => `- ${t}`).join('\n');
      parts.push(
        `\nRecently published posts (avoid covering the same ground):\n${sample}`,
      );
    }

    // Topic style examples
    parts.push(`
Topic examples for reference (generate original topics, not these):
- "Advanced TypeScript Generic Patterns in React"
- "JavaScript Event Loop Deep Dive: Microtasks vs Macrotasks"
- "Optimizing Bundle Size in Modern Web Apps with Tree Shaking"
- "New Features in TypeScript 5.x: Decorators and Beyond"
- "Building Accessible Forms with React and ARIA"
- "Server Components vs Client Components: When to Use Each"
- "JavaScript Proxy and Reflect: Practical Use Cases"
- "CSS Container Queries: Responsive Design Without Media Queries"`);

    return parts.join('\n');
  }

  // ── Private: Response Parsing ─────────────────────────────────────

  /**
   * Parses Claude's JSON response into an array of candidate objects.
   */
  private parseCandidates(
    raw: string,
  ): Array<{ topic: string; category: TopicCategory }> {
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        topics?: Array<{ topic?: string; category?: string }>;
      };

      if (!Array.isArray(parsed.topics)) {
        throw new Error('Response missing "topics" array');
      }

      const candidates: Array<{ topic: string; category: TopicCategory }> = [];

      for (const item of parsed.topics) {
        if (!item.topic || typeof item.topic !== 'string') continue;

        // Normalize category
        const rawCategory = (item.category || '').toUpperCase().trim();
        const category: TopicCategory =
          ALL_CATEGORIES.includes(rawCategory as TopicCategory)
            ? (rawCategory as TopicCategory)
            : this.assignCategory(item.topic);

        candidates.push({
          topic: item.topic.trim(),
          category,
        });
      }

      return candidates;
    } catch (error) {
      logger.error('Failed to parse topic generation response', {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: raw.slice(0, 300),
      });
      return [];
    }
  }

  /**
   * Heuristically assigns a category to a topic based on keyword analysis.
   * Used as a fallback when Claude doesn't provide a valid category.
   */
  private assignCategory(topic: string): TopicCategory {
    const lower = topic.toLowerCase();

    // TypeScript signals
    const tsSignals = [
      'typescript', 'type system', 'generic', 'utility type',
      'type guard', 'type inference', 'discriminated union',
      'mapped type', 'conditional type', 'ts ', 'tsconfig',
      'interface vs type', 'enum', 'decorator',
    ];
    if (tsSignals.some((s) => lower.includes(s))) return 'TYPESCRIPT';

    // Core JavaScript signals
    const jsSignals = [
      'javascript', 'event loop', 'prototype', 'closure',
      'promise', 'async/await', 'es2', 'ecmascript',
      'proxy', 'reflect', 'symbol', 'iterator', 'generator',
      'weakmap', 'weakset', 'weakref', 'arraybuffer',
      'node.js', 'nodejs', 'deno', 'bun runtime',
    ];
    if (jsSignals.some((s) => lower.includes(s))) return 'JAVASCRIPT';

    // Everything else → FRONTEND
    return 'FRONTEND';
  }

  // ── Private: Claude API ───────────────────────────────────────────

  /**
   * Calls Claude with rate limiting and retries.
   */
  private async callClaude(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    await this.enforceRateLimit();

    const makeRequest = async (): Promise<string> => {
      const response = await this.anthropic.messages.create({
        model: this.cfg.claudeModel,
        max_tokens: this.cfg.maxTokens,
        temperature: 0.9, // Higher temperature for creative diversity
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textBlock.text;
    };

    return this.retryAsync(makeRequest, 'Claude topic generation');
  }

  // ── Private: Rate Limiting ────────────────────────────────────────

  private async enforceRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastApiCallAt;
    const remaining = this.cfg.rateLimitMs - elapsed;

    if (remaining > 0) {
      logger.debug('Rate limit — waiting', { waitMs: remaining });
      await sleep(remaining);
    }

    this.lastApiCallAt = Date.now();
  }

  // ── Private: Retry Logic ──────────────────────────────────────────

  private async retryAsync<T>(fn: () => Promise<T>, label: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.cfg.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const retryable = this.isRetryableError(error);
        const hasMore = attempt < this.cfg.maxRetries;

        if (retryable && hasMore) {
          const delay = 1500 * Math.pow(2, attempt);
          logger.warn(`${label} failed (attempt ${attempt + 1}/${this.cfg.maxRetries + 1}) — retrying in ${delay}ms`, {
            error: lastError.message,
          });
          await sleep(delay);
        } else if (!retryable) {
          logger.error(`${label} failed with non-retryable error`, {
            error: lastError.message,
          });
          break;
        }
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('rate limit') ||
        msg.includes('overloaded') ||
        msg.includes('529') ||
        msg.includes('500') ||
        msg.includes('timeout') ||
        msg.includes('econnreset') ||
        msg.includes('econnaborted')
      );
    }
    return false;
  }

  // ── Private: Helpers ──────────────────────────────────────────────

  /**
   * Maps a Prisma TopicQueue record to the Topic interface.
   */
  private toTopic(record: {
    id: string;
    topic: string;
    category: string;
    priority: number;
    used: boolean;
    usedAt: Date | null;
    createdAt: Date;
  }): Topic {
    return {
      id: record.id,
      topic: record.topic,
      category: record.category as TopicCategory,
      priority: record.priority,
      used: record.used,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    };
  }
}

export default TopicManager;
