// ============================================
// Utility Helpers (Edge-compatible)
// ============================================
//
// Pure functions with no Node.js dependencies —
// fully compatible with Cloudflare Workers runtime.
//
// ============================================

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Counts words in markdown text, excluding fenced code blocks.
 */
export function countWords(markdown: string): number {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
  const words = withoutCode.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Counts fenced code blocks in markdown.
 */
export function countCodeBlocks(markdown: string): number {
  const matches = markdown.match(/```\w+/g);
  return matches ? matches.length : 0;
}

/**
 * Estimates reading time in minutes.
 */
export function estimateReadingTime(text: string, wpm: number = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wpm));
}

/**
 * Cleans and normalizes markdown content.
 */
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/**
 * Generates a random integer in [min, max] inclusive.
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Computes Jaccard similarity between two strings (word-level).
 */
export function computeSimilarity(a: string, b: string): number {
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'and', 'or', 'but', 'is', 'are', 'was', 'be', 'been', 'have',
    'has', 'do', 'does', 'will', 'would', 'could', 'should', 'not',
    'this', 'that', 'these', 'using', 'use', 'how', 'what', 'your',
  ]);

  const tokenize = (text: string): Set<string> => {
    const words = text.toLowerCase().replace(/[^\w\s.-]/g, ' ').split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w));
    return new Set(words);
  };

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

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
 * Returns a Unix timestamp (seconds) for a given date.
 */
export function toUnixSeconds(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Formats a Unix timestamp (seconds) into ISO 8601 string.
 */
export function fromUnixSeconds(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

/**
 * Simple structured logger for Workers (console-based).
 */
export function log(level: string, message: string, meta?: Record<string, unknown>): void {
  const entry = { level, message, ts: new Date().toISOString(), ...meta };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
