// ============================================
// AI Content Generation Service (Claude)
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { createServiceLogger } from '../config/logger';
import { GenerationPrompt, GeneratedContent, PostMetadata } from '../types';
import { slugify, estimateReadingTime } from '../utils/helpers';
import { normalizeMarkdown } from '../utils/formatters';

const logger = createServiceLogger('ai-service');

/** Anthropic client instance */
const anthropic = new Anthropic({
  apiKey: config.ai.apiKey,
});

/**
 * Generates a complete blog post using Claude AI.
 */
export async function generateBlogPost(prompt: GenerationPrompt): Promise<GeneratedContent> {
  logger.info('Generating blog post', { topic: prompt.topic, category: prompt.category });

  const systemPrompt = buildSystemPrompt(prompt);
  const userPrompt = buildUserPrompt(prompt);

  try {
    const response = await anthropic.messages.create({
      model: config.ai.model,
      max_tokens: config.ai.maxTokens,
      temperature: config.ai.temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const rawContent = extractTextContent(response);
    const parsed = parseGeneratedContent(rawContent, prompt);

    logger.info('Blog post generated successfully', {
      topic: prompt.topic,
      titleLength: parsed.title.length,
      contentLength: parsed.content.length,
    });

    return parsed;
  } catch (error) {
    logger.error('Failed to generate blog post', {
      topic: prompt.topic,
      error: String(error),
    });
    throw error;
  }
}

/**
 * Builds the system prompt for the AI.
 */
function buildSystemPrompt(prompt: GenerationPrompt): string {
  const tone = prompt.tone ?? 'professional';

  return `You are an expert blog writer specializing in ${prompt.category} content. Write high-quality, engaging, and SEO-optimized blog posts.

Guidelines:
- Write in a ${tone} tone
- Use clear headings and subheadings (## and ###)
- Include an engaging introduction and a strong conclusion
- Use bullet points and numbered lists where appropriate
- Aim for well-structured, scannable content
- Naturally incorporate the provided keywords
- Target audience: tech-savvy professionals

Your response MUST be valid JSON with this exact structure:
{
  "title": "Blog Post Title",
  "content": "Full markdown content of the blog post",
  "excerpt": "A 1-2 sentence summary (max 160 characters)",
  "metaTitle": "SEO-optimized title (max 60 characters)",
  "metaDescription": "SEO meta description (max 155 characters)",
  "tags": ["tag1", "tag2", "tag3"]
}`;
}

/**
 * Builds the user prompt with topic details and keywords.
 */
function buildUserPrompt(prompt: GenerationPrompt): string {
  const parts: string[] = [
    `Write a comprehensive blog post about: ${prompt.topic}`,
    `Category: ${prompt.category}`,
  ];

  if (prompt.keywords.length > 0) {
    parts.push(`Keywords to incorporate: ${prompt.keywords.join(', ')}`);
  }

  if (prompt.targetLength) {
    parts.push(`Target length: approximately ${prompt.targetLength} words`);
  }

  if (prompt.additionalContext) {
    parts.push(`Additional context: ${prompt.additionalContext}`);
  }

  return parts.join('\n\n');
}

/**
 * Extracts text content from the Anthropic API response.
 */
function extractTextContent(response: Anthropic.Message): string {
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in AI response');
  }
  return textBlock.text;
}

/**
 * Parses the AI response JSON into a GeneratedContent object.
 */
function parseGeneratedContent(raw: string, prompt: GenerationPrompt): GeneratedContent {
  try {
    // Try to extract JSON from the response (in case of markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const content = normalizeMarkdown(String(parsed.content || ''));
    const title = String(parsed.title || prompt.topic);

    const metadata: PostMetadata = {
      metaTitle: String(parsed.metaTitle || title).slice(0, 60),
      metaDescription: String(parsed.metaDescription || parsed.excerpt || '').slice(0, 155),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
      excerpt: String(parsed.excerpt || '').slice(0, 160),
      readingTimeMinutes: estimateReadingTime(content),
    };

    return {
      title,
      content,
      slug: slugify(title),
      category: prompt.category,
      researchSources: [],  // Populated by the pipeline from research step
      metadata,
    };
  } catch (error) {
    logger.error('Failed to parse AI response', { error: String(error) });
    throw new Error(`Failed to parse AI-generated content: ${error}`);
  }
}

export default {
  generateBlogPost,
};
