// ============================================
// Content Research Service
// ============================================
//
// Class-based research engine that combines web search with Claude AI
// analysis to produce structured, comprehensive research for blog topics.
//
// Features:
//   - Web source gathering via search APIs
//   - Claude-powered analysis and summarization
//   - Token-bucket rate limiting for API calls
//   - Exponential-backoff retries on transient failures
//   - Structured logging for every operation
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import axios, { AxiosError } from 'axios';
import { config } from '../config/env';
import { createServiceLogger } from '../config/logger';
import { Source, ResearchResult, ResearchConfig } from '../types';
import { sleep } from '../utils/helpers';

const logger = createServiceLogger('research-service');

// ── Default Configuration ───────────────────────────────────────────

const DEFAULT_CONFIG: ResearchConfig = {
  maxSources: 10,
  searchTimeout: 15000,
  claudeModel: config.ai.model,
  maxTokens: 4096,
  rateLimitMs: 1000,
  maxRetries: 3,
  retryBaseDelayMs: 1000,
};

// ── ResearchService Class ───────────────────────────────────────────

export class ResearchService {
  private readonly anthropic: Anthropic;
  private readonly researchConfig: ResearchConfig;

  /** Timestamp of the last outbound API call (for rate limiting) */
  private lastApiCallAt: number = 0;

  constructor(overrides?: Partial<ResearchConfig>) {
    this.researchConfig = { ...DEFAULT_CONFIG, ...overrides };
    this.anthropic = new Anthropic({ apiKey: config.ai.apiKey });

    logger.info('ResearchService initialized', {
      maxSources: this.researchConfig.maxSources,
      claudeModel: this.researchConfig.claudeModel,
      rateLimitMs: this.researchConfig.rateLimitMs,
    });
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Researches a topic end-to-end:
   *   1. Gathers web sources
   *   2. Sends sources to Claude for structured analysis
   *   3. Returns a fully populated ResearchResult
   */
  async researchTopic(topic: string, category: string): Promise<ResearchResult> {
    const startTime = Date.now();

    logger.info('Research started', { topic, category });

    try {
      // Step 1 — gather sources from the web
      const sources = await this.gatherSources(topic);

      logger.info('Sources gathered', {
        topic,
        sourceCount: sources.length,
        durationMs: Date.now() - startTime,
      });

      // Step 2 — analyse with Claude
      const analysis = await this.analyzeWithClaude(topic, category, sources);

      // Step 3 — build the summary from the raw analysis
      const summary = await this.summarizeFindings(sources, analysis);

      const result: ResearchResult = {
        topic,
        category,
        mainInsights: analysis.mainInsights,
        currentTrends: analysis.currentTrends,
        codeExamples: analysis.codeExamples,
        bestPractices: analysis.bestPractices,
        commonPitfalls: analysis.commonPitfalls,
        sources,
        summary,
        researchedAt: new Date(),
      };

      const durationMs = Date.now() - startTime;
      logger.info('Research completed', {
        topic,
        category,
        sourceCount: sources.length,
        insightCount: result.mainInsights.length,
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger.error('Research failed', {
        topic,
        category,
        error: error instanceof Error ? error.message : String(error),
        durationMs,
      });
      throw error;
    }
  }

  /**
   * Gathers relevant web sources for a topic from multiple search providers.
   * Results are de-duplicated by URL and scored for relevance.
   */
  async gatherSources(topic: string): Promise<Source[]> {
    logger.info('Gathering sources', { topic });

    const allSources: Source[] = [];

    // Provider 1: DuckDuckGo Instant Answers (free, no key required)
    const ddgSources = await this.fetchDuckDuckGoSources(topic);
    allSources.push(...ddgSources);

    // Provider 2: DuckDuckGo related topics for broader coverage
    const relatedSources = await this.fetchDuckDuckGoRelated(topic);
    allSources.push(...relatedSources);

    // De-duplicate by URL
    const seen = new Set<string>();
    const unique = allSources.filter((source) => {
      const normalized = source.url.toLowerCase().replace(/\/+$/, '');
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    // Score and sort by relevance
    const scored = unique.map((source) => ({
      ...source,
      relevanceScore: source.relevanceScore || this.scoreRelevance(source, topic),
    }));
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Trim to configured max
    const trimmed = scored.slice(0, this.researchConfig.maxSources);

    logger.info('Sources filtered and ranked', {
      topic,
      raw: allSources.length,
      unique: unique.length,
      kept: trimmed.length,
    });

    return trimmed;
  }

  /**
   * Produces a cohesive plain-text summary from the gathered sources
   * and the structured analysis. If Claude analysis already produced
   * a summary, it enriches it with source attribution.
   */
  async summarizeFindings(sources: Source[], analysis?: AnalysisResult): Promise<string> {
    if (sources.length === 0) {
      return 'No sources were found for this topic.';
    }

    // If we already have an analysis with insights, build the summary from it
    if (analysis && analysis.mainInsights.length > 0) {
      const insightBlock = analysis.mainInsights
        .map((insight, i) => `${i + 1}. ${insight}`)
        .join('\n');

      const trendBlock = analysis.currentTrends.length > 0
        ? `\n\nCurrent Trends:\n${analysis.currentTrends.map((t) => `- ${t}`).join('\n')}`
        : '';

      const practiceBlock = analysis.bestPractices.length > 0
        ? `\n\nBest Practices:\n${analysis.bestPractices.map((p) => `- ${p}`).join('\n')}`
        : '';

      const sourceBlock = `\n\nBased on ${sources.length} source(s): ${sources.map((s) => s.url).join(', ')}`;

      return `Key Insights:\n${insightBlock}${trendBlock}${practiceBlock}${sourceBlock}`;
    }

    // Fallback: ask Claude to produce a summary from raw sources
    const sourceList = sources
      .map((s, i) => `[${i + 1}] "${s.title}" — ${s.snippet}`)
      .join('\n');

    const prompt = `Summarize the following research sources into a concise 2-3 paragraph overview:\n\n${sourceList}`;

    const summary = await this.callClaude(
      'You are a research assistant. Produce a clear, factual summary.',
      prompt,
    );

    return summary;
  }

  // ── Source Fetching (Private) ─────────────────────────────────────

  /**
   * Fetches sources from the DuckDuckGo Instant Answer API.
   */
  private async fetchDuckDuckGoSources(topic: string): Promise<Source[]> {
    const sources: Source[] = [];

    try {
      await this.enforceRateLimit();

      const response = await this.retryRequest(() =>
        axios.get('https://api.duckduckgo.com/', {
          params: {
            q: topic,
            format: 'json',
            no_html: 1,
            skip_disambig: 1,
          },
          timeout: this.researchConfig.searchTimeout,
        }),
      );

      const data = response.data;

      // Abstract (highest quality)
      if (data.Abstract && data.AbstractURL) {
        sources.push({
          title: data.Heading || topic,
          url: data.AbstractURL,
          snippet: data.Abstract,
          relevanceScore: 1.0,
        });
      }

      // Related topics
      if (Array.isArray(data.RelatedTopics)) {
        for (const item of data.RelatedTopics) {
          if (item.Text && item.FirstURL) {
            sources.push({
              title: item.Text.slice(0, 120),
              url: item.FirstURL,
              snippet: item.Text,
              relevanceScore: 0.7,
            });
          }
          // Some entries are sub-groups
          if (Array.isArray(item.Topics)) {
            for (const sub of item.Topics) {
              if (sub.Text && sub.FirstURL) {
                sources.push({
                  title: sub.Text.slice(0, 120),
                  url: sub.FirstURL,
                  snippet: sub.Text,
                  relevanceScore: 0.5,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('DuckDuckGo primary search failed', {
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return sources;
  }

  /**
   * Fetches additional related results from DuckDuckGo with
   * a topic-specific refinement query.
   */
  private async fetchDuckDuckGoRelated(topic: string): Promise<Source[]> {
    const sources: Source[] = [];
    const refinedQuery = `${topic} best practices tutorial 2025`;

    try {
      await this.enforceRateLimit();

      const response = await this.retryRequest(() =>
        axios.get('https://api.duckduckgo.com/', {
          params: {
            q: refinedQuery,
            format: 'json',
            no_html: 1,
            skip_disambig: 1,
          },
          timeout: this.researchConfig.searchTimeout,
        }),
      );

      const data = response.data;

      if (data.Abstract && data.AbstractURL) {
        sources.push({
          title: data.Heading || refinedQuery,
          url: data.AbstractURL,
          snippet: data.Abstract,
          relevanceScore: 0.8,
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const item of data.RelatedTopics) {
          if (item.Text && item.FirstURL) {
            sources.push({
              title: item.Text.slice(0, 120),
              url: item.FirstURL,
              snippet: item.Text,
              relevanceScore: 0.6,
            });
          }
        }
      }
    } catch (error) {
      logger.warn('DuckDuckGo related search failed', {
        query: refinedQuery,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return sources;
  }

  // ── Claude AI Analysis (Private) ──────────────────────────────────

  /**
   * Sends gathered sources to Claude for structured analysis.
   * Returns parsed insights, trends, code examples, best practices,
   * and common pitfalls.
   */
  private async analyzeWithClaude(
    topic: string,
    category: string,
    sources: Source[],
  ): Promise<AnalysisResult> {
    const emptyResult: AnalysisResult = {
      mainInsights: [],
      currentTrends: [],
      codeExamples: [],
      bestPractices: [],
      commonPitfalls: [],
    };

    if (sources.length === 0) {
      logger.warn('No sources to analyze — skipping Claude call', { topic });
      return emptyResult;
    }

    const sourceContext = sources
      .map((s, i) => `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}`)
      .join('\n\n');

    const systemPrompt = `You are a senior frontend engineering researcher. Analyze research sources and provide structured, actionable insights. Always respond with valid JSON.`;

    const userPrompt = `Research the following frontend engineering topic and provide comprehensive insights: ${topic}.
Focus on: current best practices, code examples, common pitfalls, and recent developments.

Category: ${category}

Here are the sources I gathered:

${sourceContext}

Respond with a JSON object in this EXACT structure (no markdown code fences, just raw JSON):
{
  "mainInsights": ["insight 1", "insight 2", ...],
  "currentTrends": ["trend 1", "trend 2", ...],
  "codeExamples": ["// example 1 as a string", "// example 2 as a string", ...],
  "bestPractices": ["practice 1", "practice 2", ...],
  "commonPitfalls": ["pitfall 1", "pitfall 2", ...]
}

Requirements:
- Provide 3-5 items for each array
- Code examples should be complete, runnable snippets with brief comments
- Be specific and actionable — avoid vague generalities
- Reference the source material where applicable`;

    try {
      const raw = await this.callClaude(systemPrompt, userPrompt);
      return this.parseAnalysisResponse(raw);
    } catch (error) {
      logger.error('Claude analysis failed — returning empty analysis', {
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
      return emptyResult;
    }
  }

  /**
   * Parses the raw Claude response into a typed AnalysisResult.
   * Tolerates markdown code fences around the JSON.
   */
  private parseAnalysisResponse(raw: string): AnalysisResult {
    try {
      // Strip markdown code fences if present
      const cleaned = raw
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      const toStringArray = (val: unknown): string[] => {
        if (!Array.isArray(val)) return [];
        return val.filter((v): v is string => typeof v === 'string');
      };

      const result: AnalysisResult = {
        mainInsights: toStringArray(parsed.mainInsights),
        currentTrends: toStringArray(parsed.currentTrends),
        codeExamples: toStringArray(parsed.codeExamples),
        bestPractices: toStringArray(parsed.bestPractices),
        commonPitfalls: toStringArray(parsed.commonPitfalls),
      };

      logger.debug('Analysis parsed successfully', {
        insights: result.mainInsights.length,
        trends: result.currentTrends.length,
        examples: result.codeExamples.length,
        practices: result.bestPractices.length,
        pitfalls: result.commonPitfalls.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to parse Claude analysis response', {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: raw.slice(0, 200),
      });
      throw new Error(`Failed to parse analysis response: ${error}`);
    }
  }

  // ── Rate Limiting ─────────────────────────────────────────────────

  /**
   * Enforces a minimum interval between outbound API calls.
   * Sleeps for the remaining time if called too soon after the last call.
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastApiCallAt;
    const remaining = this.researchConfig.rateLimitMs - elapsed;

    if (remaining > 0) {
      logger.debug('Rate limit — waiting', { waitMs: remaining });
      await sleep(remaining);
    }

    this.lastApiCallAt = Date.now();
  }

  // ── Claude Wrapper ────────────────────────────────────────────────

  /**
   * Calls the Claude API with rate limiting and retries.
   * Returns the raw text content from the first text block.
   */
  private async callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
    await this.enforceRateLimit();

    const makeRequest = async (): Promise<string> => {
      const response = await this.anthropic.messages.create({
        model: this.researchConfig.claudeModel,
        max_tokens: this.researchConfig.maxTokens,
        temperature: 0.3,  // Lower temperature for factual research
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textBlock.text;
    };

    return this.retryAsync(makeRequest, 'Claude API call');
  }

  // ── Retry Helpers ─────────────────────────────────────────────────

  /**
   * Generic async retry with exponential backoff and logging.
   */
  private async retryAsync<T>(fn: () => Promise<T>, label: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.researchConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isRetryableError(error);
        const hasMoreAttempts = attempt < this.researchConfig.maxRetries;

        if (isRetryable && hasMoreAttempts) {
          const delay = this.researchConfig.retryBaseDelayMs * Math.pow(2, attempt);
          logger.warn(`${label} failed (attempt ${attempt + 1}/${this.researchConfig.maxRetries + 1}) — retrying in ${delay}ms`, {
            error: lastError.message,
            attempt: attempt + 1,
            nextRetryMs: delay,
          });
          await sleep(delay);
        } else if (!isRetryable) {
          logger.error(`${label} failed with non-retryable error`, {
            error: lastError.message,
            attempt: attempt + 1,
          });
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Retries an axios request with exponential backoff.
   */
  private async retryRequest<T>(fn: () => Promise<T>): Promise<T> {
    return this.retryAsync(fn, 'HTTP request');
  }

  /**
   * Determines whether an error is transient and should be retried.
   */
  private isRetryableError(error: unknown): boolean {
    // Axios errors: retry on 429, 5xx, timeouts, network errors
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
      if (!error.response) return true; // Network error
      const status = error.response.status;
      return status === 429 || status >= 500;
    }

    // Anthropic SDK errors: retry on rate limit and overloaded
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('overloaded') || msg.includes('529')) {
        return true;
      }
    }

    return false;
  }

  // ── Relevance Scoring ─────────────────────────────────────────────

  /**
   * Scores a source's relevance to the topic on a 0-1 scale.
   * Uses simple keyword overlap heuristics.
   */
  private scoreRelevance(source: Source, topic: string): number {
    const topicWords = topic.toLowerCase().split(/\s+/);
    const text = `${source.title} ${source.snippet}`.toLowerCase();

    let matches = 0;
    for (const word of topicWords) {
      if (word.length > 2 && text.includes(word)) {
        matches++;
      }
    }

    const ratio = topicWords.length > 0 ? matches / topicWords.length : 0;

    // Bonus for longer, more informative snippets
    const lengthBonus = Math.min(0.2, source.snippet.length / 1000);

    return Math.min(1, ratio * 0.8 + lengthBonus);
  }
}

// ── Internal Types ──────────────────────────────────────────────────

/** Intermediate type for the structured Claude analysis before
 *  it's merged into the final ResearchResult. */
interface AnalysisResult {
  mainInsights: string[];
  currentTrends: string[];
  codeExamples: string[];
  bestPractices: string[];
  commonPitfalls: string[];
}
