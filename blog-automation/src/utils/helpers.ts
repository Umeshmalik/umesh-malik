// ============================================
// General Helper Utilities
// ============================================

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')    // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + '...';
}

/**
 * Pauses execution for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function up to `maxRetries` times with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Strips HTML tags from a string.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Calculates estimated reading time in minutes for a given text.
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Extracts a plain-text excerpt from content.
 */
export function extractExcerpt(content: string, maxLength: number = 160): string {
  const plainText = stripHtml(content).replace(/\n+/g, ' ').trim();
  return truncate(plainText, maxLength);
}
