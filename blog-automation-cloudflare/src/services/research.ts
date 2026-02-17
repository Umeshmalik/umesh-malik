// ============================================
// Research Service (Edge-compatible)
// ============================================
//
// Gathers web sources via DuckDuckGo and analyzes
// them with Claude. Runs entirely on Workers runtime.
//
// ============================================

import type { Env, ResearchResult } from '../types/env';
import { log } from '../utils/helpers';

// ── Types ───────────────────────────────────────────────────────────

interface Source {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

interface AnalysisResult {
  mainInsights: string[];
  currentTrends: string[];
  codeExamples: string[];
  bestPractices: string[];
  commonPitfalls: string[];
}

// ── Public API ──────────────────────────────────────────────────────

export async function researchTopic(
  env: Env,
  topic: string,
  category: string,
): Promise<ResearchResult> {
  log('info', 'Research started', { topic, category });

  try {
    // Step 1: Gather sources from DuckDuckGo
    const sources = await gatherSources(topic);
    log('info', 'Sources gathered', { topic, count: sources.length });

    // Step 2: Analyze with Claude
    const analysis = await analyzeWithClaude(env, topic, category, sources);

    // Step 3: Build summary
    const summary = buildSummary(sources, analysis);

    return {
      topic,
      category,
      mainInsights: analysis.mainInsights,
      currentTrends: analysis.currentTrends,
      codeExamples: analysis.codeExamples,
      bestPractices: analysis.bestPractices,
      commonPitfalls: analysis.commonPitfalls,
      sources: sources.map((s) => ({ title: s.title, url: s.url, snippet: s.snippet })),
      summary,
    };
  } catch (error) {
    log('error', 'Research failed', { topic, error: String(error) });
    throw error;
  }
}

// ── Source Gathering ────────────────────────────────────────────────

async function gatherSources(topic: string): Promise<Source[]> {
  const allSources: Source[] = [];

  // DuckDuckGo Instant Answers API (no key required)
  try {
    const resp = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await resp.json() as Record<string, unknown>;

    if (data.Abstract && data.AbstractURL) {
      allSources.push({
        title: String(data.Heading || topic),
        url: String(data.AbstractURL),
        snippet: String(data.Abstract),
        relevanceScore: 1.0,
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const item of data.RelatedTopics as Array<Record<string, unknown>>) {
        if (item.Text && item.FirstURL) {
          allSources.push({
            title: String(item.Text).slice(0, 120),
            url: String(item.FirstURL),
            snippet: String(item.Text),
            relevanceScore: 0.7,
          });
        }
      }
    }
  } catch (err) {
    log('warn', 'DuckDuckGo search failed', { error: String(err) });
  }

  // Refined search
  try {
    const refined = `${topic} best practices tutorial 2025`;
    const resp = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(refined)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await resp.json() as Record<string, unknown>;

    if (data.Abstract && data.AbstractURL) {
      allSources.push({
        title: String(data.Heading || refined),
        url: String(data.AbstractURL),
        snippet: String(data.Abstract),
        relevanceScore: 0.8,
      });
    }
  } catch (err) {
    log('warn', 'DuckDuckGo refined search failed', { error: String(err) });
  }

  // De-duplicate by URL
  const seen = new Set<string>();
  const unique = allSources.filter((s) => {
    const norm = s.url.toLowerCase().replace(/\/+$/, '');
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  // Sort by relevance, take top 10
  unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return unique.slice(0, 10);
}

// ── Claude Analysis ────────────────────────────────────────────────

async function analyzeWithClaude(
  env: Env,
  topic: string,
  category: string,
  sources: Source[],
): Promise<AnalysisResult> {
  const empty: AnalysisResult = {
    mainInsights: [],
    currentTrends: [],
    codeExamples: [],
    bestPractices: [],
    commonPitfalls: [],
  };

  if (sources.length === 0) return empty;

  const sourceContext = sources
    .map((s, i) => `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}`)
    .join('\n\n');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: parseInt(env.MAX_TOKENS || '4096'),
        temperature: 0.3,
        system: 'You are a senior frontend engineering researcher. Analyze sources and provide structured insights. Always respond with valid JSON.',
        messages: [{
          role: 'user',
          content: `Research topic: ${topic}\nCategory: ${category}\n\nSources:\n${sourceContext}\n\nRespond with JSON:\n{"mainInsights":["..."],"currentTrends":["..."],"codeExamples":["..."],"bestPractices":["..."],"commonPitfalls":["..."]}`,
        }],
      }),
    });

    if (!resp.ok) {
      throw new Error(`Claude API error: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content.find((b) => b.type === 'text')?.text || '';
    return parseAnalysis(text, empty);
  } catch (err) {
    log('error', 'Claude analysis failed', { error: String(err) });
    return empty;
  }
}

function parseAnalysis(raw: string, fallback: AnalysisResult): AnalysisResult {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return fallback;

    const parsed = JSON.parse(match[0]);
    const toArr = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

    return {
      mainInsights: toArr(parsed.mainInsights),
      currentTrends: toArr(parsed.currentTrends),
      codeExamples: toArr(parsed.codeExamples),
      bestPractices: toArr(parsed.bestPractices),
      commonPitfalls: toArr(parsed.commonPitfalls),
    };
  } catch {
    return fallback;
  }
}

function buildSummary(sources: Source[], analysis: AnalysisResult): string {
  if (analysis.mainInsights.length === 0) {
    return sources.length > 0
      ? `Research gathered ${sources.length} source(s) but no structured insights were extracted.`
      : 'No sources found for this topic.';
  }

  const insights = analysis.mainInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
  const trends = analysis.currentTrends.length > 0
    ? `\n\nTrends: ${analysis.currentTrends.join(', ')}`
    : '';

  return `Key Insights:\n${insights}${trends}\n\nBased on ${sources.length} source(s).`;
}
