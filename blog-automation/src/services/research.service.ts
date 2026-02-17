// ============================================
// Topic Queue & Research Orchestrator
// ============================================
//
// Thin orchestration layer that bridges:
//   - TopicManager (queue management, topic generation, validation)
//   - ResearchService (web search + Claude analysis)
//
// Provides a unified API for the scheduler to consume.
// ============================================

import { createServiceLogger } from '../config/logger';
import { ResearchResult, PostCategoryType, Topic, TopicCategory } from '../types';
import prisma from '../database/client';
import { ResearchService } from './researchService';
import { TopicManager } from './topicManager';

const logger = createServiceLogger('topic-queue');

/** Shared service instances (initialised once) */
const researchService = new ResearchService();
const topicManager = new TopicManager();

// ── Research ────────────────────────────────────────────────────────

/**
 * Researches a topic from the queue by ID.
 * Delegates the actual research to ResearchService.
 */
export async function researchTopic(topicId: string): Promise<ResearchResult> {
  const topic = await prisma.topicQueue.findUnique({ where: { id: topicId } });

  if (!topic) {
    throw new Error(`Topic not found: ${topicId}`);
  }

  logger.info('Dispatching research', { topicId, topic: topic.topic, category: topic.category });

  return researchService.researchTopic(topic.topic, topic.category);
}

// ── Queue Operations (delegated to TopicManager) ────────────────────

/**
 * Creates a new topic in the queue.
 */
export async function createTopic(
  topic: string,
  category: PostCategoryType,
  priority: number = 0,
): Promise<string> {
  // Use TopicManager.addTopics for validation and de-duplication
  await topicManager.addTopics([topic], category as TopicCategory, priority);

  // Return the ID of the most recently created topic matching this text
  const record = await prisma.topicQueue.findFirst({
    where: { topic: topic.trim(), category },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new Error(`Topic was rejected by validation: "${topic}"`);
  }

  logger.info('Topic created via TopicManager', { topicId: record.id, topic });
  return record.id;
}

/**
 * Fetches the next unused topic, using TopicManager's category rotation
 * and auto-refresh logic.
 */
export async function getNextPendingTopic(): Promise<Topic | null> {
  try {
    return await topicManager.getNextTopic();
  } catch {
    // TopicManager throws if queue is empty
    logger.warn('No pending topics available');
    return null;
  }
}

/**
 * Marks a topic as used in the queue.
 */
export async function markTopicUsed(topicId: string): Promise<void> {
  await topicManager.markTopicAsUsed(topicId);
}

// ── Service Access ──────────────────────────────────────────────────

/** Returns the shared ResearchService instance for direct use. */
export function getResearchService(): ResearchService {
  return researchService;
}

/** Returns the shared TopicManager instance for direct use. */
export function getTopicManager(): TopicManager {
  return topicManager;
}

export default {
  researchTopic,
  createTopic,
  getNextPendingTopic,
  markTopicUsed,
  getResearchService,
  getTopicManager,
};
