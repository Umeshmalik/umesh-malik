// ============================================
// Blog Post Pipeline Service
// ============================================
//
// Orchestrates the database-side of the publishing pipeline:
//   - Draft creation from generated content
//   - Post scheduling
//   - Publishing via PublishService (CMS communication)
//   - BlogPost status management
//
// CMS communication and PublishLog writing is delegated to PublishService.
// ============================================

import { createServiceLogger } from '../config/logger';
import {
  GeneratedContent,
  BlogContent,
  PublishResult,
} from '../types';
import prisma from '../database/client';
import { PublishService } from './publishService';

const logger = createServiceLogger('posting-service');

/** Shared PublishService instance */
const publishService = new PublishService();

// ── Publishing ──────────────────────────────────────────────────────

/**
 * Publishes a blog post by its database ID.
 *
 * 1. Fetches the BlogPost record
 * 2. Delegates CMS communication to PublishService
 * 3. Updates the BlogPost status based on the result
 */
export async function publishPost(
  postId: string,
  asDraft: boolean = false,
): Promise<PublishResult> {
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });

  if (!post) {
    throw new Error(`Blog post not found: ${postId}`);
  }

  logger.info('Publishing blog post', { postId, title: post.title, asDraft });

  // Delegate to PublishService (handles CMS call, retries, logging)
  const result = await publishService.publishToWebsite(post, asDraft);

  // Update DB status based on the result
  if (result.success) {
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        publishedAt: result.publishedAt ?? new Date(),
      },
    });

    logger.info('Blog post status updated to PUBLISHED', { postId });
  } else {
    await prisma.blogPost.update({
      where: { id: postId },
      data: { status: 'FAILED' },
    });

    logger.error('Blog post status updated to FAILED', {
      postId,
      error: result.error,
    });
  }

  return result;
}

// ── Draft Creation ──────────────────────────────────────────────────

/**
 * Creates a blog post record in the local database from generated content.
 * Accepts either a BlogContent (from ContentGenerator) or a
 * GeneratedContent (legacy, from ai.service) object.
 */
export async function saveDraft(
  content: BlogContent | GeneratedContent,
): Promise<string> {
  // Resolve metadata: BlogContent uses `seo`, GeneratedContent uses `metadata`
  const metadata = 'seo' in content ? content.seo : content.metadata;

  const post = await prisma.blogPost.create({
    data: {
      title: content.title,
      slug: content.slug,
      content: content.content,
      category: content.category,
      researchSources: JSON.parse(JSON.stringify(content.researchSources)),
      metadata: JSON.parse(JSON.stringify(metadata)),
      status: 'DRAFT',
    },
  });

  logger.info('Draft saved', { postId: post.id, title: post.title });
  return post.id;
}

// ── Scheduling ──────────────────────────────────────────────────────

/**
 * Schedules a draft post for future publication.
 */
export async function schedulePost(postId: string, scheduledFor: Date): Promise<void> {
  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      status: 'SCHEDULED',
      scheduledFor,
    },
  });

  logger.info('Post scheduled', { postId, scheduledFor: scheduledFor.toISOString() });
}

// ── Queries ─────────────────────────────────────────────────────────

/**
 * Retrieves posts that are scheduled and due for publishing.
 */
export async function getPostsReadyToPublish() {
  return prisma.blogPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: {
        lte: new Date(),
      },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

/**
 * Retrieves recent published posts.
 */
export async function getRecentPublishedPosts(limit: number = 10) {
  return prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

/**
 * Retrieves the full publish history for a specific post.
 */
export async function getPublishHistory(postId: string) {
  return prisma.publishLog.findMany({
    where: { postId },
    orderBy: { attemptedAt: 'desc' },
  });
}

// ── Service Access ──────────────────────────────────────────────────

/**
 * Returns the shared PublishService instance for direct access
 * (e.g. for connection validation, image uploads, or rollbacks).
 */
export function getPublishService(): PublishService {
  return publishService;
}

export default {
  publishPost,
  saveDraft,
  schedulePost,
  getPostsReadyToPublish,
  getRecentPublishedPosts,
  getPublishHistory,
  getPublishService,
};
