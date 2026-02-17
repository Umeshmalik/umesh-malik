// ============================================
// Blog Content Generation Service (Claude)
// ============================================
//
// Class-based content generator that uses Claude Sonnet 4 to produce
// high-quality, validated, SEO-optimized blog posts from research data.
//
// Features:
//   - Structured markdown generation with section validation
//   - Word count enforcement (1500-2500 words)
//   - Code block verification (proper fencing + language tags)
//   - SEO optimization pass via dedicated Claude call
//   - Automatic retry on validation failure with targeted feedback
//   - Rate limiting and exponential-backoff retries on API errors
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { createServiceLogger } from '../config/logger';
import {
  ResearchResult,
  BlogContent,
  SEOMetadata,
  ContentSection,
  ContentValidationResult,
  PostCategoryType,
} from '../types';
import { slugify, sleep, estimateReadingTime } from '../utils/helpers';
import { normalizeMarkdown } from '../utils/formatters';

const logger = createServiceLogger('content-generator');

// ── Constants ───────────────────────────────────────────────────────

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;
const GENERATION_TEMPERATURE = 0.7;
const SEO_TEMPERATURE = 0.4;
const RATE_LIMIT_MS = 1000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1500;
const MIN_WORD_COUNT = 1500;
const MAX_WORD_COUNT = 2500;
const MIN_CODE_BLOCKS = 3;
const MIN_SECTIONS = 3;
const MAX_VALIDATION_RETRIES = 2;

// ── ContentGenerator Class ──────────────────────────────────────────

export class ContentGenerator {
  private readonly anthropic: Anthropic;
  private lastApiCallAt: number = 0;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: config.ai.apiKey });
    logger.info('ContentGenerator initialized', { model: CLAUDE_MODEL });
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Generates a complete, validated, SEO-optimized blog post from
   * research data.
   *
   * Pipeline:
   *   1. Call Claude to generate title + markdown + SEO metadata
   *   2. Parse and validate the output
   *   3. If validation fails, retry with targeted feedback (up to 2x)
   *   4. Run an SEO optimization pass
   *   5. Return the final BlogContent
   */
  async generateBlogPost(
    research: ResearchResult,
    topic: string,
  ): Promise<BlogContent> {
    const startTime = Date.now();
    const category = research.category as PostCategoryType;

    logger.info('Blog post generation started', { topic, category });

    let blogContent: BlogContent | null = null;
    let lastValidation: ContentValidationResult | null = null;

    // Generate with up to MAX_VALIDATION_RETRIES retries on validation failure
    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      const raw = await this.callClaudeForContent(
        topic,
        category,
        research,
        lastValidation,
      );

      blogContent = this.parseContentResponse(raw, topic, category, research);
      lastValidation = this.validateContent(blogContent);

      if (lastValidation.isValid) {
        logger.info('Content passed validation', {
          topic,
          attempt: attempt + 1,
          wordCount: lastValidation.wordCount,
          codeBlocks: lastValidation.codeBlockCount,
          sections: lastValidation.sectionCount,
        });
        break;
      }

      if (attempt < MAX_VALIDATION_RETRIES) {
        logger.warn('Content failed validation — retrying with feedback', {
          topic,
          attempt: attempt + 1,
          errors: lastValidation.errors,
          warnings: lastValidation.warnings,
        });
      } else {
        logger.warn('Content still has validation issues after retries — proceeding anyway', {
          topic,
          errors: lastValidation.errors,
          warnings: lastValidation.warnings,
        });
      }
    }

    // SEO optimization pass
    blogContent = await this.optimizeForSEO(blogContent!);

    const durationMs = Date.now() - startTime;
    logger.info('Blog post generation completed', {
      topic,
      title: blogContent.title,
      wordCount: blogContent.wordCount,
      codeBlocks: blogContent.codeBlockCount,
      sections: blogContent.sections.length,
      durationMs,
    });

    return blogContent;
  }

  /**
   * Generates an optimized title for a blog post topic.
   * Callable independently from generateBlogPost.
   */
  async generateTitle(
    topic: string,
    research: ResearchResult,
  ): Promise<string> {
    logger.info('Generating title', { topic });

    const systemPrompt = `You are an expert technical content strategist. Generate a single, compelling blog post title.

Requirements:
- Attention-grabbing but not clickbait
- Clearly communicates the value to the reader
- Optimized for search engines (include the primary keyword)
- 50-70 characters long
- Target audience: intermediate to advanced frontend developers

Respond with ONLY the title text — no quotes, no explanation, no JSON.`;

    const keyInsights = research.mainInsights.slice(0, 3).join('; ');

    const userPrompt = `Generate a blog post title for the topic: "${topic}"

Category: ${research.category}
Key insights to reflect: ${keyInsights}
Current trends: ${research.currentTrends.slice(0, 3).join(', ')}`;

    const raw = await this.callClaude(systemPrompt, userPrompt, 0.8);
    const title = raw.replace(/^["']|["']$/g, '').trim();

    logger.info('Title generated', { topic, title });
    return title;
  }

  /**
   * Generates a URL-safe slug from a title.
   * Ensures uniqueness by appending a short date-based suffix.
   */
  async generateSlug(title: string): Promise<string> {
    const base = slugify(title);
    const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const slug = `${base}-${dateSuffix}`;

    logger.debug('Slug generated', { title, slug });
    return slug;
  }

  /**
   * Runs an SEO optimization pass on existing BlogContent.
   * Sends the content to Claude to refine the meta title, description,
   * tags, excerpt, and focus keyword.
   */
  async optimizeForSEO(content: BlogContent): Promise<BlogContent> {
    logger.info('Running SEO optimization', { title: content.title });

    const systemPrompt = `You are an SEO specialist for technical blogs targeting frontend developers. Analyze the given blog post and produce optimized SEO metadata.

Respond with valid JSON only (no markdown fences):
{
  "metaTitle": "SEO title, max 60 chars, include primary keyword",
  "metaDescription": "Compelling description, max 155 chars, include primary keyword and CTA",
  "tags": ["5-8 relevant tags mixing broad and specific terms"],
  "excerpt": "Engaging 1-2 sentence summary, max 160 chars",
  "focusKeyword": "the single most important keyword phrase"
}`;

    const userPrompt = `Optimize SEO for this blog post:

Title: ${content.title}
Category: ${content.category}
Current tags: ${content.seo.tags.join(', ')}
Word count: ${content.wordCount}

Content preview (first 500 chars):
${content.content.slice(0, 500)}

Section headings:
${content.sections.map((s) => `${'#'.repeat(s.level)} ${s.heading}`).join('\n')}`;

    try {
      const raw = await this.callClaude(systemPrompt, userPrompt, SEO_TEMPERATURE);
      const optimized = this.parseSEOResponse(raw, content.seo);

      logger.info('SEO optimization complete', {
        title: content.title,
        metaTitle: optimized.metaTitle,
        focusKeyword: optimized.focusKeyword,
        tagCount: optimized.tags.length,
      });

      return {
        ...content,
        seo: optimized,
      };
    } catch (error) {
      logger.warn('SEO optimization failed — keeping original metadata', {
        error: error instanceof Error ? error.message : String(error),
      });
      return content;
    }
  }

  // ── Content Generation (Private) ──────────────────────────────────

  /**
   * Calls Claude to generate the full blog post.
   * If a previous validation result is provided, includes that as
   * corrective feedback in the prompt.
   */
  private async callClaudeForContent(
    topic: string,
    category: PostCategoryType,
    research: ResearchResult,
    validationFeedback: ContentValidationResult | null,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(topic, category);
    const userPrompt = this.buildUserPrompt(topic, research, validationFeedback);

    return this.callClaude(systemPrompt, userPrompt, GENERATION_TEMPERATURE);
  }

  /**
   * System prompt that defines writing style, structure, and output format.
   */
  private buildSystemPrompt(topic: string, category: string): string {
    return `You are an expert frontend engineering blogger with deep expertise in ${category}. Write a comprehensive, practical blog post about ${topic}. Include real-world code examples, best practices, and current industry standards. Format in markdown.

WRITING STYLE:
- Professional but approachable — write like a senior developer mentoring a colleague
- Target audience: intermediate to advanced frontend developers
- Tone: educational and practical — every paragraph should teach something useful
- Avoid fluff, filler phrases, and vague generalities

CONTENT STRUCTURE (all sections REQUIRED):
1. **Engaging Introduction** (2-3 paragraphs)
   - Hook the reader with a relatable problem or scenario
   - Explain what the post covers and why it matters
   - Set expectations for what they will learn

2. **3-5 Main Sections** (use ## headings)
   - Each section focuses on one key aspect of the topic
   - Include complete, runnable code examples with syntax highlighting
   - Use ### subsections to break down complex ideas
   - Explain the "why" behind each approach, not just the "how"

3. **Best Practices Section** (## heading)
   - Actionable dos and don'ts
   - Common patterns to follow and anti-patterns to avoid
   - Performance and maintainability considerations

4. **Conclusion with Key Takeaways** (## heading)
   - Summarize 4-6 main points as a bulleted list
   - Include a forward-looking call-to-action or next steps

CODE EXAMPLES:
- Must be complete and runnable — no "..." or "// rest of code" placeholders
- Use proper syntax highlighting: \`\`\`typescript, \`\`\`javascript, \`\`\`css, etc.
- Include brief inline comments explaining non-obvious logic
- Show "before and after" comparisons where applicable

LENGTH: 1500-2500 words (excluding code blocks). This is critical — do not go under 1500 or over 2500.

RESPONSE FORMAT — respond with valid JSON only (no markdown code fences around the JSON):
{
  "title": "Compelling, SEO-friendly title (50-70 chars)",
  "content": "Full markdown body of the blog post",
  "excerpt": "1-2 sentence summary, max 160 chars",
  "metaTitle": "SEO page title, max 60 chars",
  "metaDescription": "SEO meta description, max 155 chars",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
  }

  /**
   * User prompt that includes the research context and optional
   * corrective feedback from a failed validation attempt.
   */
  private buildUserPrompt(
    topic: string,
    research: ResearchResult,
    validationFeedback: ContentValidationResult | null,
  ): string {
    const parts: string[] = [];

    parts.push(`Write a comprehensive blog post about: ${topic}`);
    parts.push(`Category: ${research.category}`);

    // Research context
    if (research.mainInsights.length > 0) {
      parts.push(`Key insights from research:\n${research.mainInsights.map((i) => `- ${i}`).join('\n')}`);
    }

    if (research.currentTrends.length > 0) {
      parts.push(`Current trends to reference:\n${research.currentTrends.map((t) => `- ${t}`).join('\n')}`);
    }

    if (research.bestPractices.length > 0) {
      parts.push(`Best practices to cover:\n${research.bestPractices.map((p) => `- ${p}`).join('\n')}`);
    }

    if (research.commonPitfalls.length > 0) {
      parts.push(`Common pitfalls to address:\n${research.commonPitfalls.map((p) => `- ${p}`).join('\n')}`);
    }

    if (research.codeExamples.length > 0) {
      parts.push(`Reference code examples:\n${research.codeExamples.slice(0, 3).join('\n\n')}`);
    }

    if (research.summary) {
      parts.push(`Research summary: ${research.summary}`);
    }

    // Corrective feedback from previous attempt
    if (validationFeedback && !validationFeedback.isValid) {
      const feedback = [
        'IMPORTANT — Your previous attempt had these issues that MUST be fixed:',
        ...validationFeedback.errors.map((e) => `  ERROR: ${e}`),
        ...validationFeedback.warnings.map((w) => `  WARNING: ${w}`),
      ];
      parts.push(feedback.join('\n'));
    }

    return parts.join('\n\n');
  }

  // ── Response Parsing ──────────────────────────────────────────────

  /**
   * Parses the raw Claude JSON response into a BlogContent object.
   */
  private parseContentResponse(
    raw: string,
    topic: string,
    category: PostCategoryType,
    research: ResearchResult,
  ): BlogContent {
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      const title = String(parsed.title || topic);
      const content = normalizeMarkdown(String(parsed.content || ''));
      const sections = this.parseSections(content);
      const wordCount = this.countWords(content);
      const codeBlockCount = this.countCodeBlocks(content);

      const seo: SEOMetadata = {
        metaTitle: String(parsed.metaTitle || title).slice(0, 60),
        metaDescription: String(parsed.metaDescription || '').slice(0, 155),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        excerpt: String(parsed.excerpt || '').slice(0, 160),
        readingTimeMinutes: estimateReadingTime(content),
      };

      return {
        title,
        slug: slugify(title),
        content,
        category,
        sections,
        wordCount,
        codeBlockCount,
        researchSources: research.sources,
        seo,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to parse content response', {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: raw.slice(0, 300),
      });
      throw new Error(`Failed to parse generated blog content: ${error}`);
    }
  }

  /**
   * Parses the raw Claude JSON response for SEO optimization.
   * Falls back to the original metadata on any parse failure.
   */
  private parseSEOResponse(raw: string, fallback: SEOMetadata): SEOMetadata {
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in SEO response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      return {
        metaTitle: String(parsed.metaTitle || fallback.metaTitle).slice(0, 60),
        metaDescription: String(parsed.metaDescription || fallback.metaDescription).slice(0, 155),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : fallback.tags,
        excerpt: String(parsed.excerpt || fallback.excerpt).slice(0, 160),
        readingTimeMinutes: fallback.readingTimeMinutes,
        focusKeyword: parsed.focusKeyword ? String(parsed.focusKeyword) : undefined,
      };
    } catch (error) {
      logger.warn('Failed to parse SEO response — using fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      return fallback;
    }
  }

  // ── Content Validation ────────────────────────────────────────────

  /**
   * Validates the generated blog content against quality requirements:
   *   - Word count within 1500-2500
   *   - At least 3 properly fenced code blocks with language tags
   *   - At least 3 top-level (##) sections
   *   - Has an introduction (content before first ##)
   *   - Has a conclusion or takeaway section
   */
  private validateContent(content: BlogContent): ContentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Word count
    if (content.wordCount < MIN_WORD_COUNT) {
      errors.push(
        `Word count too low: ${content.wordCount} words (minimum ${MIN_WORD_COUNT}). Add more detailed explanations and examples.`,
      );
    } else if (content.wordCount > MAX_WORD_COUNT) {
      warnings.push(
        `Word count is high: ${content.wordCount} words (target max ${MAX_WORD_COUNT}). Consider tightening some sections.`,
      );
    }

    // Code blocks
    if (content.codeBlockCount < MIN_CODE_BLOCKS) {
      errors.push(
        `Not enough code examples: found ${content.codeBlockCount} (minimum ${MIN_CODE_BLOCKS}). Add more complete, runnable code snippets.`,
      );
    }

    // Check for code blocks missing language tags
    const untaggedBlocks = (content.content.match(/^```\s*$/gm) || []).length;
    if (untaggedBlocks > 0) {
      warnings.push(
        `${untaggedBlocks} code block(s) missing language tags. Use \`\`\`typescript, \`\`\`javascript, etc.`,
      );
    }

    // Section count (## level headings)
    const topLevelSections = content.sections.filter((s) => s.level === 2);
    if (topLevelSections.length < MIN_SECTIONS) {
      errors.push(
        `Not enough main sections: found ${topLevelSections.length} (minimum ${MIN_SECTIONS}). Add more ## sections covering different aspects.`,
      );
    }

    // Introduction check (content before first heading)
    const firstHeadingIndex = content.content.search(/^##\s/m);
    if (firstHeadingIndex <= 0) {
      warnings.push(
        'Missing introduction — add 2-3 paragraphs before the first ## heading.',
      );
    } else {
      const intro = content.content.slice(0, firstHeadingIndex).trim();
      const introWords = intro.split(/\s+/).length;
      if (introWords < 40) {
        warnings.push(
          `Introduction is too short (${introWords} words). Expand to 2-3 paragraphs.`,
        );
      }
    }

    // Conclusion / takeaways check
    const headingsLower = topLevelSections.map((s) => s.heading.toLowerCase());
    const hasConclusion = headingsLower.some(
      (h) => h.includes('conclusion') || h.includes('takeaway') || h.includes('summary') || h.includes('wrapping up'),
    );
    if (!hasConclusion) {
      warnings.push(
        'Missing conclusion section. Add a ## Conclusion or ## Key Takeaways section.',
      );
    }

    // Best practices check
    const hasBestPractices = headingsLower.some(
      (h) => h.includes('best practice') || h.includes('dos and don') || h.includes('tips'),
    );
    if (!hasBestPractices) {
      warnings.push(
        'Missing best practices section. Add a ## Best Practices section.',
      );
    }

    return {
      isValid: errors.length === 0,
      wordCount: content.wordCount,
      codeBlockCount: content.codeBlockCount,
      sectionCount: topLevelSections.length,
      errors,
      warnings,
    };
  }

  // ── Markdown Parsing Helpers ──────────────────────────────────────

  /**
   * Parses markdown content into an array of ContentSection objects
   * by splitting on ## and ### headings.
   */
  private parseSections(markdown: string): ContentSection[] {
    const sections: ContentSection[] = [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = [...markdown.matchAll(headingRegex)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const level = match[1].length;
      const heading = match[2].trim();

      // Body runs from after this heading to the start of the next heading (or EOF)
      const bodyStart = match.index! + match[0].length;
      const bodyEnd = i + 1 < matches.length ? matches[i + 1].index! : markdown.length;
      const body = markdown.slice(bodyStart, bodyEnd).trim();

      sections.push({
        heading,
        level,
        body,
        hasCodeBlock: /```\w+/.test(body),
      });
    }

    return sections;
  }

  /**
   * Counts words in markdown text, excluding fenced code blocks.
   */
  private countWords(markdown: string): number {
    // Remove fenced code blocks before counting
    const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
    const words = withoutCode.trim().split(/\s+/).filter((w) => w.length > 0);
    return words.length;
  }

  /**
   * Counts the number of fenced code blocks in markdown.
   */
  private countCodeBlocks(markdown: string): number {
    const matches = markdown.match(/```\w+/g);
    return matches ? matches.length : 0;
  }

  // ── Claude API ────────────────────────────────────────────────────

  /**
   * Calls the Claude API with rate limiting and retries.
   * Returns the raw text content from the response.
   */
  private async callClaude(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
  ): Promise<string> {
    await this.enforceRateLimit();

    const makeRequest = async (): Promise<string> => {
      const response = await this.anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textBlock.text;
    };

    return this.retryAsync(makeRequest, 'Claude API');
  }

  // ── Rate Limiting ─────────────────────────────────────────────────

  /**
   * Enforces a minimum interval between outbound API calls.
   */
  private async enforceRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastApiCallAt;
    const remaining = RATE_LIMIT_MS - elapsed;

    if (remaining > 0) {
      logger.debug('Rate limit — waiting', { waitMs: remaining });
      await sleep(remaining);
    }

    this.lastApiCallAt = Date.now();
  }

  // ── Retry Logic ───────────────────────────────────────────────────

  /**
   * Generic retry with exponential backoff.
   * Only retries on transient (rate-limit, network, 5xx) errors.
   */
  private async retryAsync<T>(fn: () => Promise<T>, label: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const retryable = this.isRetryableError(error);
        const hasMore = attempt < MAX_RETRIES;

        if (retryable && hasMore) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          logger.warn(`${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}) — retrying in ${delay}ms`, {
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

  /**
   * Determines whether an error is transient and worth retrying.
   */
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
}
