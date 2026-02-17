// ============================================
// Publishing Service (Edge-compatible)
// ============================================
//
// Publishes blog posts to the configured CMS.
// Supports WordPress REST API, custom REST API,
// and static site (GitHub) targets.
//
// ============================================

import type { Env, BlogRow, PublishResult } from '../types/env';
import * as db from '../db/queries';
import { log } from '../utils/helpers';

// ── Public API ──────────────────────────────────────────────────────

/**
 * Publishes a blog post to the configured CMS.
 */
export async function publishPost(
  env: Env,
  blog: BlogRow,
): Promise<PublishResult> {
  const dryRun = env.DRY_RUN === 'true';

  log('info', 'Publishing blog post', { blogId: blog.id, title: blog.title, dryRun });

  // Dry-run mode
  if (dryRun) {
    await db.logPublishAttempt(env.DB, blog.id, true);
    return {
      success: true,
      postId: `dry-run-${blog.id}`,
      url: `https://umesh-malik.com/${blog.slug}`,
      dryRun: true,
    };
  }

  try {
    const result = await postToCMS(env, blog);

    // Update blog status
    const now = Math.floor(Date.now() / 1000);
    await db.updateBlogStatus(env.DB, blog.id, 'published', now);
    await db.logPublishAttempt(env.DB, blog.id, true);

    log('info', 'Blog published successfully', { blogId: blog.id, url: result.url });

    return {
      success: true,
      postId: result.id,
      url: result.url,
      dryRun: false,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await db.updateBlogStatus(env.DB, blog.id, 'failed');
    await db.logPublishAttempt(env.DB, blog.id, false, errorMsg);

    log('error', 'Publishing failed', { blogId: blog.id, error: errorMsg });

    return {
      success: false,
      error: errorMsg,
      dryRun: false,
    };
  }
}

/**
 * Checks all scheduled blogs and publishes those that are due.
 */
export async function publishDueBlogs(env: Env): Promise<{
  published: number;
  failed: number;
}> {
  const dueBlogs = await db.getDueBlogs(env.DB);
  log('info', 'Checking due blogs', { count: dueBlogs.length });

  let published = 0;
  let failed = 0;

  for (const blog of dueBlogs) {
    const result = await publishPost(env, blog);
    if (result.success) {
      published++;
    } else {
      failed++;
    }
  }

  return { published, failed };
}

/**
 * Validates the CMS connection.
 */
export async function validateConnection(env: Env): Promise<boolean> {
  try {
    const type = env.WEBSITE_TYPE || 'custom';

    if (type === 'wordpress') {
      const auth = btoa(`${env.WP_USERNAME}:${env.WP_APP_PASSWORD}`);
      const resp = await fetch(`${env.WEBSITE_API_URL}/wp-json/wp/v2/users/me`, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(10000),
      });
      return resp.ok;
    }

    // Custom API — try health endpoint
    const resp = await fetch(`${env.WEBSITE_API_URL}/health`, {
      headers: { Authorization: `Bearer ${env.WEBSITE_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// ── CMS Posting ────────────────────────────────────────────────────

interface CMSResponse {
  id: string;
  url: string;
}

async function postToCMS(env: Env, blog: BlogRow): Promise<CMSResponse> {
  const type = env.WEBSITE_TYPE || 'custom';
  const metadata = blog.metadata ? JSON.parse(blog.metadata) : {};

  switch (type) {
    case 'wordpress':
      return postToWordPress(env, blog, metadata);
    case 'custom':
      return postToCustomAPI(env, blog, metadata);
    default:
      throw new Error(`Unsupported website type: ${type}`);
  }
}

async function postToWordPress(
  env: Env,
  blog: BlogRow,
  metadata: Record<string, unknown>,
): Promise<CMSResponse> {
  const auth = btoa(`${env.WP_USERNAME}:${env.WP_APP_PASSWORD}`);
  const baseUrl = env.WEBSITE_API_URL.replace(/\/+$/, '');

  // Convert markdown to basic HTML
  const htmlContent = markdownToHtml(blog.content);

  const payload: Record<string, unknown> = {
    title: blog.title,
    content: htmlContent,
    slug: blog.slug,
    status: 'publish',
    excerpt: String(metadata.excerpt || ''),
  };

  // SEO metadata via Yoast
  if (metadata.metaTitle || metadata.metaDescription) {
    payload.meta = {
      _yoast_wpseo_title: metadata.metaTitle || '',
      _yoast_wpseo_metadesc: metadata.metaDescription || '',
    };
  }

  const resp = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`WordPress API error ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json() as Record<string, unknown>;
  return {
    id: String(data.id),
    url: String(data.link || ''),
  };
}

async function postToCustomAPI(
  env: Env,
  blog: BlogRow,
  metadata: Record<string, unknown>,
): Promise<CMSResponse> {
  const baseUrl = env.WEBSITE_API_URL.replace(/\/+$/, '');

  const resp = await fetch(`${baseUrl}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.WEBSITE_API_KEY}`,
    },
    body: JSON.stringify({
      title: blog.title,
      content: blog.content,
      slug: blog.slug,
      status: 'publish',
      category: blog.category,
      tags: (metadata.tags as string[]) || [],
      metaTitle: metadata.metaTitle || '',
      metaDescription: metadata.metaDescription || '',
      excerpt: metadata.excerpt || '',
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`CMS API error ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json() as Record<string, unknown>;
  return {
    id: String(data.id),
    url: String(data.url || ''),
  };
}

// ── Markdown → HTML (lightweight) ──────────────────────────────────

function markdownToHtml(md: string): string {
  let html = md;

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const cls = lang ? ` class="language-${lang}"` : '';
    const escaped = code.trimEnd().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs
  html = html.split(/\n{2,}/).map((block) => {
    const t = block.trim();
    if (!t) return '';
    if (/^<(h[1-6]|ul|ol|pre|blockquote)/i.test(t)) return t;
    return `<p>${t.replace(/\n/g, '<br>')}</p>`;
  }).filter(Boolean).join('\n\n');

  return html;
}
