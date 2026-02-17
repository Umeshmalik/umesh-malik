// ============================================
// Content Formatters
// ============================================

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Formats a date for display in blog posts.
 */
export function formatPostDate(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Formats a date in ISO 8601 format for APIs and metadata.
 */
export function formatISODate(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

/**
 * Formats a word count into a human-readable string.
 */
export function formatWordCount(text: string): string {
  const count = text.trim().split(/\s+/).length;
  return `${count.toLocaleString()} words`;
}

/**
 * Cleans and normalizes markdown content for consistent output.
 */
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, '\n')       // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')   // Collapse excessive blank lines
    .replace(/[ \t]+$/gm, '')     // Remove trailing whitespace
    .trim();
}

/**
 * Converts a title to title case.
 */
export function toTitleCase(str: string): string {
  const minorWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in',
    'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet',
  ]);

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !minorWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}
