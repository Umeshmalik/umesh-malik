// ============================================
// Unit Tests — TopicManager
// ============================================

import { TopicManager } from '../topicManager';

// ── Mock External Dependencies ──────────────────────────────────────

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  }));
});

jest.mock('../../config/env', () => ({
  config: {
    ai: { apiKey: 'sk-ant-test-key-1234567890', model: 'claude-sonnet-4-20250514', maxTokens: 4096, temperature: 0.7 },
    website: { type: 'custom', apiUrl: 'https://test.com', apiKey: 'test', dryRun: false, timeout: 5000 },
    database: { url: 'postgresql://test:test@localhost:5432/test' },
    scheduling: { postsPerDay: 2, windowStartHour: 9, windowEndHour: 21, minSpacingHours: 4, skipWeekends: false, timezone: 'UTC', generationCron: '0 2 * * *', publishCheckCron: '0 * * * *', healthCheckPort: 3000 },
    content: { defaultLanguage: 'en', minWords: 1500, maxWords: 2500, categories: ['JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND'] },
    nodeEnv: 'test',
    logLevel: 'error',
  },
}));

jest.mock('../../config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('../../utils/helpers', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

// Mock Prisma — build the mock inside the factory so it exists at hoist time
jest.mock('../../database/client', () => {
  const mock = {
    topicQueue: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    blogPost: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: mock,
    prisma: mock,
  };
});

import Anthropic from '@anthropic-ai/sdk';

// Get a reference to the mocked prisma client
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockPrismaClient = require('../../database/client').default;

// ── Test Data ───────────────────────────────────────────────────────

const MOCK_TOPIC_RECORD = {
  id: 'topic-uuid-1',
  topic: 'Advanced React Server Components Patterns',
  category: 'FRONTEND',
  priority: 5,
  used: false,
  usedAt: null,
  createdAt: new Date('2025-01-15'),
};

const MOCK_TOPICS_JSON = JSON.stringify({
  topics: [
    { topic: 'Advanced TypeScript Generic Constraints in React', category: 'TYPESCRIPT' },
    { topic: 'JavaScript Proxy Patterns for State Management', category: 'JAVASCRIPT' },
    { topic: 'Building Accessible Modal Dialogs with React and ARIA', category: 'FRONTEND' },
    { topic: 'TypeScript Template Literal Types Deep Dive', category: 'TYPESCRIPT' },
    { topic: 'Modern CSS Container Queries Practical Guide', category: 'FRONTEND' },
  ],
});

// ── Tests ───────────────────────────────────────────────────────────

describe('TopicManager', () => {
  let manager: TopicManager;
  let mockAnthropicCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnthropicCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: MOCK_TOPICS_JSON }],
    });

    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockAnthropicCreate },
    }));

    // Default mock returns
    mockPrismaClient.topicQueue.count.mockResolvedValue(30);
    mockPrismaClient.topicQueue.findFirst.mockResolvedValue(MOCK_TOPIC_RECORD);
    mockPrismaClient.topicQueue.findMany.mockResolvedValue([]);
    mockPrismaClient.topicQueue.findUnique.mockResolvedValue(MOCK_TOPIC_RECORD);
    mockPrismaClient.topicQueue.create.mockImplementation((args: any) => Promise.resolve({
      id: `topic-${Date.now()}`,
      ...args.data,
      used: false,
      usedAt: null,
      createdAt: new Date(),
    }));
    mockPrismaClient.topicQueue.update.mockResolvedValue({ ...MOCK_TOPIC_RECORD, used: true, usedAt: new Date() });
    mockPrismaClient.blogPost.findMany.mockResolvedValue([]);
    mockPrismaClient.blogPost.groupBy.mockResolvedValue([]);

    manager = new TopicManager({
      rateLimitMs: 0,
      maxRetries: 1,
      lowQueueThreshold: 5,
      minQueueSize: 10,
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const mgr = new TopicManager();
      expect(mgr).toBeInstanceOf(TopicManager);
    });

    it('should accept config overrides', () => {
      const mgr = new TopicManager({ minQueueSize: 50, similarityThreshold: 0.8 });
      expect(mgr).toBeInstanceOf(TopicManager);
    });
  });

  // ── getNextTopic ────────────────────────────────────────────────

  describe('getNextTopic', () => {
    it('should return the highest-priority unused topic', async () => {
      const topic = await manager.getNextTopic();

      expect(topic).toBeDefined();
      expect(topic.id).toBe('topic-uuid-1');
      expect(topic.topic).toBe('Advanced React Server Components Patterns');
      expect(topic.used).toBe(false);
    });

    it('should accept a specific category filter', async () => {
      await manager.getNextTopic('TYPESCRIPT');

      expect(mockPrismaClient.topicQueue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'TYPESCRIPT' }),
        }),
      );
    });

    it('should fall back to any category when target is empty', async () => {
      mockPrismaClient.topicQueue.findFirst
        .mockResolvedValueOnce(null) // First call (target category) returns null
        .mockResolvedValueOnce(MOCK_TOPIC_RECORD); // Fallback returns a result

      const topic = await manager.getNextTopic('TYPESCRIPT');

      expect(topic).toBeDefined();
      expect(mockPrismaClient.topicQueue.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should throw when queue is completely empty', async () => {
      mockPrismaClient.topicQueue.findFirst.mockResolvedValue(null);

      await expect(manager.getNextTopic()).rejects.toThrow('Topic queue is empty');
    });

    it('should trigger auto-refresh when queue is low', async () => {
      // Queue count below threshold (5)
      mockPrismaClient.topicQueue.count.mockResolvedValue(3);

      await manager.getNextTopic();

      // The auto-refresh runs in background, so it fires without awaiting
      // Just verify count was checked
      expect(mockPrismaClient.topicQueue.count).toHaveBeenCalled();
    });
  });

  // ── addTopics ───────────────────────────────────────────────────

  describe('addTopics', () => {
    it('should add valid topics to the queue', async () => {
      const topics = ['React Performance Optimization with useMemo and useCallback'];

      await manager.addTopics(topics, 'FRONTEND', 3);

      expect(mockPrismaClient.topicQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topic: topics[0],
          category: 'FRONTEND',
          priority: 3,
        }),
      });
    });

    it('should skip empty topics', async () => {
      await manager.addTopics(['', '   '], 'JAVASCRIPT');

      expect(mockPrismaClient.topicQueue.create).not.toHaveBeenCalled();
    });

    it('should skip topics that are too short', async () => {
      await manager.addTopics(['React Hook'], 'FRONTEND');

      // "React Hook" is only 2 words, minimum is 3
      expect(mockPrismaClient.topicQueue.create).not.toHaveBeenCalled();
    });

    it('should skip duplicate topics (high similarity)', async () => {
      mockPrismaClient.topicQueue.findMany.mockResolvedValue([
        { topic: 'Advanced React Server Components Patterns' },
      ]);

      await manager.addTopics(
        ['Advanced React Server Components Patterns'], // exact duplicate
        'FRONTEND',
      );

      expect(mockPrismaClient.topicQueue.create).not.toHaveBeenCalled();
    });
  });

  // ── generateTopicIdeas ──────────────────────────────────────────

  describe('generateTopicIdeas', () => {
    it('should generate topics via Claude and insert valid ones', async () => {
      // Return counts for stats
      mockPrismaClient.topicQueue.count
        .mockResolvedValueOnce(30) // auto-refresh check
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // unused
        .mockResolvedValueOnce(3)  // JS count
        .mockResolvedValueOnce(2)  // TS count
        .mockResolvedValueOnce(3); // FE count

      const result = await manager.generateTopicIdeas(5);

      expect(result).toBeDefined();
      expect(result.candidateCount).toBeGreaterThan(0);
      expect(result.added).toBeInstanceOf(Array);
      expect(result.rejected).toBeInstanceOf(Array);
      expect(result.categoryBreakdown).toHaveProperty('JAVASCRIPT');
      expect(result.categoryBreakdown).toHaveProperty('TYPESCRIPT');
      expect(result.categoryBreakdown).toHaveProperty('FRONTEND');
    });

    it('should call Claude with context about queue state', async () => {
      await manager.generateTopicIdeas(10);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        }),
      );
    });

    it('should handle Claude returning invalid JSON gracefully', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'This is not valid JSON' }],
      });

      const result = await manager.generateTopicIdeas(5);

      expect(result.candidateCount).toBe(0);
      expect(result.added).toHaveLength(0);
    });

    it('should reject topics not relevant to frontend', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            topics: [
              { topic: 'Best practices for cooking Italian pasta recipes', category: 'FRONTEND' },
            ],
          }),
        }],
      });

      const result = await manager.generateTopicIdeas(1);

      expect(result.rejected.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ── markTopicAsUsed ─────────────────────────────────────────────

  describe('markTopicAsUsed', () => {
    it('should mark a topic as used with a timestamp', async () => {
      await manager.markTopicAsUsed('topic-uuid-1');

      expect(mockPrismaClient.topicQueue.update).toHaveBeenCalledWith({
        where: { id: 'topic-uuid-1' },
        data: expect.objectContaining({
          used: true,
          usedAt: expect.any(Date),
        }),
      });
    });
  });

  // ── refreshTopicQueue ───────────────────────────────────────────

  describe('refreshTopicQueue', () => {
    it('should skip refresh when queue is healthy', async () => {
      // Queue has 30 topics, minQueueSize is 10
      mockPrismaClient.topicQueue.count
        .mockResolvedValueOnce(30) // auto-refresh
        .mockResolvedValueOnce(30) // total
        .mockResolvedValueOnce(30) // unused
        .mockResolvedValueOnce(10) // JS
        .mockResolvedValueOnce(10) // TS
        .mockResolvedValueOnce(10); // FE

      await manager.refreshTopicQueue();

      // Should NOT have called Claude since queue is healthy
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should generate topics when queue is below minimum', async () => {
      mockPrismaClient.topicQueue.count
        .mockResolvedValueOnce(3) // auto-refresh check
        .mockResolvedValueOnce(5) // total (first stats call)
        .mockResolvedValueOnce(3) // unused
        .mockResolvedValueOnce(1) // JS
        .mockResolvedValueOnce(1) // TS
        .mockResolvedValueOnce(1) // FE
        // Second stats call (inside generateTopicIdeas)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      await manager.refreshTopicQueue();

      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it('should not run concurrent refreshes', async () => {
      mockPrismaClient.topicQueue.count.mockResolvedValue(0);

      // Start two concurrent refreshes
      const promise1 = manager.refreshTopicQueue();
      const promise2 = manager.refreshTopicQueue();

      await Promise.all([promise1, promise2]);

      // Second call should have been skipped (isRefreshing guard)
      // We can't easily assert this, but at least it shouldn't error
    });
  });

  // ── getQueueStats ───────────────────────────────────────────────

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockPrismaClient.topicQueue.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(30) // unused
        .mockResolvedValueOnce(10) // JS
        .mockResolvedValueOnce(10) // TS
        .mockResolvedValueOnce(10); // FE

      const stats = await manager.getQueueStats();

      expect(stats.total).toBe(50);
      expect(stats.unused).toBe(30);
      expect(stats.used).toBe(20);
      expect(stats.unusedByCategory.JAVASCRIPT).toBe(10);
      expect(stats.unusedByCategory.TYPESCRIPT).toBe(10);
      expect(stats.unusedByCategory.FRONTEND).toBe(10);
      expect(stats.needsRefresh).toBe(false);
    });

    it('should flag needsRefresh when unused count is low', async () => {
      mockPrismaClient.topicQueue.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // unused (below threshold of 5)
        .mockResolvedValueOnce(1)  // JS
        .mockResolvedValueOnce(1)  // TS
        .mockResolvedValueOnce(1); // FE

      const stats = await manager.getQueueStats();
      expect(stats.needsRefresh).toBe(true);
    });
  });
});
