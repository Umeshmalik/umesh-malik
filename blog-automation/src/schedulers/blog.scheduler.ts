// ============================================
// Blog Post Scheduler (Cron Jobs)
// ============================================

import cron from 'node-cron';
import { config } from '../config/env';
import { createServiceLogger } from '../config/logger';
import { ContentGenerator } from '../services/contentGenerator';
import { researchTopic, getNextPendingTopic, markTopicUsed } from '../services/research.service';
import { saveDraft, publishPost, getPostsReadyToPublish } from '../services/posting.service';

const logger = createServiceLogger('scheduler');

/** Shared ContentGenerator instance */
const contentGenerator = new ContentGenerator();

/**
 * The main blog generation pipeline:
 * 1. Pick the next unused topic from the queue
 * 2. Research the topic (web search + Claude analysis)
 * 3. Generate a validated, SEO-optimized blog post
 * 4. Save the draft and publish it
 */
async function runBlogPipeline(): Promise<void> {
  try {
    logger.info('Blog pipeline started');

    // Step 1: Get next topic from the queue
    const topic = await getNextPendingTopic();
    if (!topic) {
      logger.warn('No pending topics found. Skipping this run.');
      return;
    }

    logger.info('Processing topic', { topicId: topic.id, topic: topic.topic, category: topic.category });

    // Step 2: Research the topic
    const researchResult = await researchTopic(topic.id);

    // Step 3: Generate blog post with ContentGenerator
    const blogContent = await contentGenerator.generateBlogPost(
      researchResult,
      topic.topic,
    );

    // Step 4: Save draft
    const postId = await saveDraft(blogContent);

    // Step 5: Mark topic as used in the queue
    await markTopicUsed(topic.id);

    // Step 6: Publish
    await publishPost(postId);

    logger.info('Blog pipeline completed successfully', {
      postId,
      topic: topic.topic,
      wordCount: blogContent.wordCount,
      codeBlocks: blogContent.codeBlockCount,
    });
  } catch (error) {
    logger.error('Blog pipeline failed', { error: String(error) });
  }
}

/**
 * Publishes any scheduled posts whose scheduledFor date has passed.
 */
async function runPublishScheduledPosts(): Promise<void> {
  const posts = await getPostsReadyToPublish();

  if (posts.length === 0) {
    logger.debug('No scheduled posts ready to publish');
    return;
  }

  logger.info(`Publishing ${posts.length} scheduled post(s)`);

  for (const post of posts) {
    try {
      await publishPost(post.id);
    } catch (error) {
      logger.error('Failed to publish scheduled post', {
        postId: post.id,
        error: String(error),
      });
    }
  }
}

/**
 * @deprecated Use BlogScheduler class from blogScheduler.ts instead.
 * Initializes and starts cron jobs (legacy entry point).
 */
export function startSchedulers(): void {
  const cronExpression = config.scheduling.generationCron;

  // Validate the cron expression
  if (!cron.validate(cronExpression)) {
    logger.error('Invalid cron expression', { cronExpression });
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  // Main blog generation pipeline
  cron.schedule(cronExpression, () => {
    logger.info('Cron triggered: blog-pipeline');
    runBlogPipeline().catch((error) => {
      logger.error('Unhandled error in blog pipeline', { error: String(error) });
    });
  });

  // Publish scheduled posts — runs every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    runPublishScheduledPosts().catch((error) => {
      logger.error('Unhandled error in publish scheduler', { error: String(error) });
    });
  });

  logger.info('Schedulers started', {
    blogPipeline: cronExpression,
    publishCheck: '*/15 * * * *',
  });
}

export default {
  startSchedulers,
  runBlogPipeline,
};
