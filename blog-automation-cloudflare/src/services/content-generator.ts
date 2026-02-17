// ============================================
// Content Generator Service (Edge-compatible)
// ============================================
//
// Generates blog posts via Claude API, validates them,
// and returns structured content ready for D1 storage.
//
// ============================================

import type { Env, GeneratedContent, ResearchResult } from '../types/env';
import { slugify, countWords, countCodeBlocks, normalizeMarkdown, log } from '../utils/helpers';

// ── Public API ──────────────────────────────────────────────────────

export async function generateBlogPost(
  env: Env,
  topic: string,
  category: string,
  research: ResearchResult,
): Promise<GeneratedContent> {
  log('info', 'Generating blog post', { topic, category });

  const systemPrompt = buildSystemPrompt(topic, category);
  const userPrompt = buildUserPrompt(topic, research);

  // Generate with up to 2 validation retries
  let lastContent: GeneratedContent | null = null;
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    const feedbackPrompt = attempt > 0 && lastErrors.length > 0
      ? `\n\nIMPORTANT — Fix these issues from your previous attempt:\n${lastErrors.map((e) => `- ${e}`).join('\n')}`
      : '';

    const raw = await callClaude(env, systemPrompt, userPrompt + feedbackPrompt, 0.7);
    lastContent = parseResponse(raw, topic, category, research);

    const validation = validateContent(lastContent);
    if (validation.isValid) {
      log('info', 'Content passed validation', {
        topic,
        attempt: attempt + 1,
        wordCount: lastContent.wordCount,
      });
      break;
    }

    lastErrors = validation.errors;
    if (attempt < 2) {
      log('warn', 'Content failed validation, retrying', { attempt: attempt + 1, errors: lastErrors });
    }
  }

  // SEO optimization pass
  lastContent = await optimizeSEO(env, lastContent!);

  log('info', 'Blog post generated', {
    title: lastContent.title,
    wordCount: lastContent.wordCount,
    codeBlocks: lastContent.codeBlockCount,
  });

  return lastContent;
}

export async function generateTitle(
  env: Env,
  topic: string,
  category: string,
): Promise<string> {
  const raw = await callClaude(
    env,
    'Generate a single compelling blog post title. Respond with ONLY the title text.',
    `Topic: "${topic}"\nCategory: ${category}\nRequirements: 50-70 chars, SEO-optimized, specific.`,
    0.8,
  );

  return raw.replace(/^["']|["']$/g, '').trim();
}

// ── Prompt Building ────────────────────────────────────────────────

function buildSystemPrompt(topic: string, category: string): string {
  return `You are an expert frontend engineering blogger with deep expertise in ${category}. Write a comprehensive, practical blog post about ${topic}.

WRITING STYLE: Professional but approachable. Target: intermediate to advanced frontend developers.

STRUCTURE (ALL REQUIRED):
1. Engaging introduction (2-3 paragraphs)
2. 3-5 main sections (## headings) with code examples
3. Best practices section (## heading)
4. Conclusion with key takeaways (## heading)

CODE: Complete, runnable examples with \`\`\`typescript or \`\`\`javascript fencing.
LENGTH: 1500-2500 words (excluding code blocks).

RESPOND with valid JSON only (no markdown fences):
{
  "title": "SEO-friendly title (50-70 chars)",
  "content": "Full markdown body",
  "excerpt": "1-2 sentence summary, max 160 chars",
  "metaTitle": "SEO page title, max 60 chars",
  "metaDescription": "SEO meta description, max 155 chars",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
}

function buildUserPrompt(topic: string, research: ResearchResult): string {
  const parts: string[] = [`Write a comprehensive blog post about: ${topic}`, `Category: ${research.category}`];

  if (research.mainInsights.length > 0)
    parts.push(`Key insights:\n${research.mainInsights.map((i) => `- ${i}`).join('\n')}`);
  if (research.currentTrends.length > 0)
    parts.push(`Trends: ${research.currentTrends.join(', ')}`);
  if (research.bestPractices.length > 0)
    parts.push(`Best practices:\n${research.bestPractices.map((p) => `- ${p}`).join('\n')}`);
  if (research.commonPitfalls.length > 0)
    parts.push(`Pitfalls to address:\n${research.commonPitfalls.map((p) => `- ${p}`).join('\n')}`);
  if (research.summary)
    parts.push(`Research summary: ${research.summary}`);

  return parts.join('\n\n');
}

// ── Response Parsing ───────────────────────────────────────────────

function parseResponse(
  raw: string,
  topic: string,
  category: string,
  research: ResearchResult,
): GeneratedContent {
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object in Claude response');

  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  const content = normalizeMarkdown(String(parsed.content || ''));
  const title = String(parsed.title || topic);
  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return {
    title,
    content,
    slug: `${slugify(title)}-${dateSuffix}`,
    excerpt: String(parsed.excerpt || '').slice(0, 160),
    metaTitle: String(parsed.metaTitle || title).slice(0, 60),
    metaDescription: String(parsed.metaDescription || '').slice(0, 155),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    wordCount: countWords(content),
    codeBlockCount: countCodeBlocks(content),
  };
}

// ── Content Validation ─────────────────────────────────────────────

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function validateContent(c: GeneratedContent): ValidationResult {
  const errors: string[] = [];
  const minWords = 1500;
  const maxWords = 2500;

  if (c.wordCount < minWords)
    errors.push(`Word count too low: ${c.wordCount} (min ${minWords})`);
  if (c.wordCount > maxWords * 1.5)
    errors.push(`Word count too high: ${c.wordCount}`);
  if (c.codeBlockCount < 3)
    errors.push(`Not enough code examples: ${c.codeBlockCount} (min 3)`);

  const sectionCount = (c.content.match(/^##\s/gm) || []).length;
  if (sectionCount < 3)
    errors.push(`Not enough sections: ${sectionCount} (min 3)`);

  return { isValid: errors.length === 0, errors };
}

// ── SEO Optimization ───────────────────────────────────────────────

async function optimizeSEO(env: Env, content: GeneratedContent): Promise<GeneratedContent> {
  try {
    const raw = await callClaude(
      env,
      'You are an SEO specialist for technical blogs. Respond with valid JSON only.',
      `Optimize SEO for this post:\nTitle: ${content.title}\nTags: ${content.tags.join(', ')}\nWord count: ${content.wordCount}\nContent preview: ${content.content.slice(0, 400)}\n\nRespond: {"metaTitle":"max 60 chars","metaDescription":"max 155 chars","tags":["5-8 tags"],"excerpt":"max 160 chars","focusKeyword":"primary keyword"}`,
      0.4,
    );

    const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return content;

    const seo = JSON.parse(match[0]);
    return {
      ...content,
      metaTitle: String(seo.metaTitle || content.metaTitle).slice(0, 60),
      metaDescription: String(seo.metaDescription || content.metaDescription).slice(0, 155),
      tags: Array.isArray(seo.tags) ? seo.tags.map(String) : content.tags,
      excerpt: String(seo.excerpt || content.excerpt).slice(0, 160),
    };
  } catch (err) {
    log('warn', 'SEO optimization failed, keeping original', { error: String(err) });
    return content;
  }
}

// ── Claude API Wrapper ─────────────────────────────────────────────

async function callClaude(
  env: Env,
  system: string,
  user: string,
  temperature: number,
): Promise<string> {
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
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json() as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response');

  return textBlock.text;
}
