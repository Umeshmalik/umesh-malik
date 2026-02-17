// ============================================
// R2 Object Storage Layer
// ============================================
//
// Uses Cloudflare R2 for:
//   - Blog post backups (JSON snapshots)
//   - Image asset storage
//   - Database export archives
//
// ============================================

import type { Env } from '../types/env';
import { log } from '../utils/helpers';

// ── Blog Backups ────────────────────────────────────────────────────

/**
 * Stores a JSON backup of a blog post in R2.
 */
export async function backupBlogPost(
  env: Env,
  blogId: number,
  data: Record<string, unknown>,
): Promise<string> {
  const key = `backups/blogs/${blogId}.json`;
  const body = JSON.stringify(data, null, 2);

  await env.ASSETS.put(key, body, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      blogId: String(blogId),
      backedUpAt: new Date().toISOString(),
    },
  });

  log('info', 'Blog backed up to R2', { blogId, key });
  return key;
}

/**
 * Retrieves a blog backup from R2.
 */
export async function getBlogBackup(
  env: Env,
  blogId: number,
): Promise<Record<string, unknown> | null> {
  const key = `backups/blogs/${blogId}.json`;
  const obj = await env.ASSETS.get(key);
  if (!obj) return null;

  const text = await obj.text();
  return JSON.parse(text);
}

// ── Image Storage ───────────────────────────────────────────────────

/**
 * Stores an image in R2 and returns the public URL.
 */
export async function uploadImage(
  env: Env,
  filename: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const key = `images/${Date.now()}-${filename}`;

  await env.ASSETS.put(key, data, {
    httpMetadata: { contentType },
    customMetadata: {
      originalFilename: filename,
      uploadedAt: new Date().toISOString(),
    },
  });

  log('info', 'Image uploaded to R2', { key, contentType });

  // Note: For public access, configure R2 bucket with a custom domain
  // or use a Worker to proxy R2 objects
  return key;
}

/**
 * Retrieves an image from R2.
 */
export async function getImage(
  env: Env,
  key: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const obj = await env.ASSETS.get(key);
  if (!obj) return null;

  return {
    data: await obj.arrayBuffer(),
    contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
  };
}

/**
 * Deletes an image from R2.
 */
export async function deleteImage(env: Env, key: string): Promise<void> {
  await env.ASSETS.delete(key);
  log('info', 'Image deleted from R2', { key });
}

// ── Database Exports ────────────────────────────────────────────────

/**
 * Stores a full database export snapshot in R2.
 */
export async function storeDBExport(
  env: Env,
  data: Record<string, unknown>,
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = `exports/db-export-${timestamp}.json`;
  const body = JSON.stringify(data, null, 2);

  await env.ASSETS.put(key, body, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      exportedAt: new Date().toISOString(),
      sizeBytes: String(new TextEncoder().encode(body).length),
    },
  });

  log('info', 'DB export stored in R2', { key });
  return key;
}

/**
 * Lists all database export files in R2.
 */
export async function listDBExports(env: Env): Promise<Array<{
  key: string;
  size: number;
  uploaded: string;
}>> {
  const list = await env.ASSETS.list({ prefix: 'exports/' });

  return list.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }));
}

// ── Cleanup ─────────────────────────────────────────────────────────

/**
 * Deletes old backups and exports beyond retention period.
 */
export async function cleanupOldFiles(
  env: Env,
  prefixes: string[] = ['backups/', 'exports/'],
  retentionDays: number = 30,
): Promise<{ deleted: number }> {
  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  let deleted = 0;

  for (const prefix of prefixes) {
    const list = await env.ASSETS.list({ prefix });

    for (const obj of list.objects) {
      if (obj.uploaded.getTime() < cutoff) {
        await env.ASSETS.delete(obj.key);
        deleted++;
      }
    }
  }

  log('info', 'R2 cleanup complete', { deleted, retentionDays });
  return { deleted };
}
