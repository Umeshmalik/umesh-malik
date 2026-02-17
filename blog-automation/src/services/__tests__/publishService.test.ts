// ============================================
// Unit Tests — PublishService
// ============================================

import { PublishService } from '../publishService';

// ── Mock External Dependencies ──────────────────────────────────────

const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(),
  post: jest.fn(),
  AxiosError: class AxiosError extends Error {
    code?: string;
    response?: { status: number };
    constructor(message: string) {
      super(message);
    }
  },
}));

jest.mock('../../config/env', () => ({
  config: {
    ai: { apiKey: 'sk-ant-test-key', model: 'claude-sonnet-4-20250514', maxTokens: 4096, temperature: 0.7 },
    website: {
      type: 'custom',
      apiUrl: 'https://api.test.com',
      apiKey: 'test-api-key-123',
      wpUsername: undefined,
      wpAppPassword: undefined,
      gitRepoUrl: undefined,
      gitBranch: 'main',
      gitToken: undefined,
      dryRun: false,
      timeout: 5000,
    },
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

jest.mock('../../database/client', () => ({
  __esModule: true,
  default: {
    publishLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
  },
  prisma: {
    publishLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
  },
}));

jest.mock('../../utils/helpers', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

// ── Test Data ───────────────────────────────────────────────────────

const makeMockPost = (overrides?: Record<string, unknown>) => ({
  id: 'post-uuid-123',
  title: 'Test Blog Post',
  content: '## Introduction\n\nThis is a test blog post content.',
  slug: 'test-blog-post',
  category: 'FRONTEND',
  status: 'DRAFT',
  researchSources: null,
  scheduledFor: null,
  publishedAt: null,
  metadata: {
    metaTitle: 'Test SEO Title',
    metaDescription: 'Test meta description for SEO.',
    tags: ['react', 'testing'],
    excerpt: 'A test blog post excerpt.',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ── Tests ───────────────────────────────────────────────────────────

describe('PublishService', () => {
  let service: PublishService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublishService();
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize the PublishService with custom adapter', () => {
      expect(service).toBeInstanceOf(PublishService);
    });
  });

  // ── publishToWebsite ────────────────────────────────────────────

  describe('publishToWebsite', () => {
    it('should publish a blog post successfully', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { id: 'cms-post-1', url: 'https://test.com/test-blog-post', status: 'publish' },
      });

      const post = makeMockPost();
      const result = await service.publishToWebsite(post as any);

      expect(result.success).toBe(true);
      expect(result.postId).toBe('cms-post-1');
      expect(result.url).toBe('https://test.com/test-blog-post');
      expect(result.adapter).toBe('custom');
      expect(result.dryRun).toBe(false);
    });

    it('should return failure result on CMS error', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('CMS unreachable'));

      const post = makeMockPost();
      const result = await service.publishToWebsite(post as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('CMS unreachable');
    });

    it('should log publish attempts to the database', async () => {
      const prisma = require('../../database/client').default;

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { id: 'cms-1', url: 'https://test.com/slug', status: 'publish' },
      });

      const post = makeMockPost();
      await service.publishToWebsite(post as any);

      expect(prisma.publishLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postId: 'post-uuid-123',
          success: true,
        }),
      });
    });

    it('should include duration in the result', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { id: '1', url: 'https://test.com/post', status: 'publish' },
      });

      const post = makeMockPost();
      const result = await service.publishToWebsite(post as any);

      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Dry Run Mode ────────────────────────────────────────────────

  describe('dry run mode', () => {
    it('should simulate publishing in dry-run mode', async () => {
      // Mutate the mocked config to enable dry-run
      const envModule = require('../../config/env');
      const originalDryRun = envModule.config.website.dryRun;
      envModule.config.website.dryRun = true;

      try {
        const dryRunService = new PublishService();
        const post = makeMockPost();
        const result = await dryRunService.publishToWebsite(post as any);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.postId).toContain('dry-run');

        // CMS adapter should NOT have been called
        expect(mockAxiosInstance.post).not.toHaveBeenCalled();
      } finally {
        // Always restore
        envModule.config.website.dryRun = originalDryRun;
      }
    });
  });

  // ── validateConnection ──────────────────────────────────────────

  describe('validateConnection', () => {
    it('should return true when CMS is reachable', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ status: 200 });

      const isValid = await service.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should return false when CMS is unreachable', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection refused'));
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection refused'));

      const isValid = await service.validateConnection();
      expect(isValid).toBe(false);
    });
  });

  // ── uploadImages ────────────────────────────────────────────────

  describe('uploadImages', () => {
    it('should upload images and return URLs', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { url: 'https://test.com/images/hero.png' },
      });

      const images = [{
        filename: 'hero.png',
        data: Buffer.from('fake-image-data'),
        mimeType: 'image/png',
        altText: 'Hero image',
      }];

      const urls = await service.uploadImages(images);
      expect(urls).toHaveLength(1);
      expect(urls[0]).toBe('https://test.com/images/hero.png');
    });

    it('should continue uploading remaining images when one fails', async () => {
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({ data: { url: 'https://test.com/images/img2.png' } });

      const images = [
        { filename: 'img1.png', data: Buffer.from('data1'), mimeType: 'image/png' },
        { filename: 'img2.png', data: Buffer.from('data2'), mimeType: 'image/png' },
      ];

      const urls = await service.uploadImages(images);
      // First failed, second succeeded
      expect(urls).toHaveLength(1);
    });
  });

  // ── updatePost ──────────────────────────────────────────────────

  describe('updatePost', () => {
    it('should update a post on the CMS', async () => {
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: { id: 'cms-1', url: 'https://test.com/updated', status: 'publish' },
      });

      const post = makeMockPost();
      const result = await service.updatePost('cms-1', post as any);
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockAxiosInstance.put.mockRejectedValueOnce(new Error('Update failed'));

      const post = makeMockPost();
      const result = await service.updatePost('cms-1', post as any);
      expect(result).toBe(false);
    });
  });

  // ── deletePost ──────────────────────────────────────────────────

  describe('deletePost', () => {
    it('should delete a post from the CMS', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ status: 204 });

      const result = await service.deletePost('cms-1');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await service.deletePost('cms-1');
      expect(result).toBe(false);
    });
  });

  // ── rollback ────────────────────────────────────────────────────

  describe('rollback', () => {
    it('should roll back a published post by deleting it', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ status: 204 });

      const result = await service.rollback('cms-1');
      expect(result).toBe(true);
    });

    it('should return false when rollback fails', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce(new Error('Rollback failed'));

      const result = await service.rollback('cms-1');
      expect(result).toBe(false);
    });
  });
});
