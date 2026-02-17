// ============================================
// Integration Tests — Database Operations
// ============================================
//
// These tests verify Prisma model operations against
// a real (test) PostgreSQL database.
//
// Prerequisites:
//   - DATABASE_URL must point to a test database
//   - Run `npx prisma migrate dev` before running these tests
//
// ============================================

import { PrismaClient, PostCategory, PostStatus } from '@prisma/client';

// ── Prisma client for tests ─────────────────────────────────────────

const prisma = new PrismaClient();

// ── Hooks ───────────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up test data
  await prisma.publishLog.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.topicQueue.deleteMany({});
  await prisma.systemConfig.deleteMany({});
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean between tests
  await prisma.publishLog.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.topicQueue.deleteMany({});
});

// ── Tests ───────────────────────────────────────────────────────────

describe('Database Integration', () => {
  // ── Connection ──────────────────────────────────────────────────

  describe('Connection', () => {
    it('should connect to the database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as result`;
      expect(result).toBeDefined();
    });

    it('should execute raw queries', async () => {
      const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
      expect(result[0].now).toBeInstanceOf(Date);
    });
  });

  // ── BlogPost Model ─────────────────────────────────────────────

  describe('BlogPost CRUD', () => {
    it('should create a blog post', async () => {
      const post = await prisma.blogPost.create({
        data: {
          title: 'Test Blog Post',
          content: '## Hello\n\nThis is a test post.',
          slug: `test-blog-post-${Date.now()}`,
          category: PostCategory.JAVASCRIPT,
          status: PostStatus.DRAFT,
        },
      });

      expect(post.id).toBeTruthy();
      expect(post.title).toBe('Test Blog Post');
      expect(post.category).toBe('JAVASCRIPT');
      expect(post.status).toBe('DRAFT');
      expect(post.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique slug constraint', async () => {
      const slug = `unique-slug-${Date.now()}`;

      await prisma.blogPost.create({
        data: {
          title: 'Post 1',
          content: 'Content 1',
          slug,
          category: PostCategory.TYPESCRIPT,
        },
      });

      await expect(
        prisma.blogPost.create({
          data: {
            title: 'Post 2',
            content: 'Content 2',
            slug, // duplicate slug
            category: PostCategory.TYPESCRIPT,
          },
        }),
      ).rejects.toThrow();
    });

    it('should update a blog post status', async () => {
      const post = await prisma.blogPost.create({
        data: {
          title: 'Draft Post',
          content: 'Will be published.',
          slug: `draft-post-${Date.now()}`,
          category: PostCategory.FRONTEND,
          status: PostStatus.DRAFT,
        },
      });

      const updated = await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      expect(updated.status).toBe('PUBLISHED');
      expect(updated.publishedAt).toBeInstanceOf(Date);
    });

    it('should store and retrieve JSON metadata', async () => {
      const metadata = {
        metaTitle: 'SEO Title',
        metaDescription: 'SEO description',
        tags: ['react', 'typescript'],
        excerpt: 'A brief excerpt.',
      };

      const post = await prisma.blogPost.create({
        data: {
          title: 'Post with Metadata',
          content: 'Content with metadata.',
          slug: `meta-post-${Date.now()}`,
          category: PostCategory.JAVASCRIPT,
          metadata: JSON.parse(JSON.stringify(metadata)),
        },
      });

      const fetched = await prisma.blogPost.findUnique({ where: { id: post.id } });
      const fetchedMeta = fetched!.metadata as Record<string, unknown>;

      expect(fetchedMeta.metaTitle).toBe('SEO Title');
      expect((fetchedMeta.tags as string[])).toContain('react');
    });

    it('should filter posts by status', async () => {
      await prisma.blogPost.createMany({
        data: [
          { title: 'Draft 1', content: 'C1', slug: `d1-${Date.now()}`, category: PostCategory.JAVASCRIPT, status: PostStatus.DRAFT },
          { title: 'Published 1', content: 'C2', slug: `p1-${Date.now()}`, category: PostCategory.JAVASCRIPT, status: PostStatus.PUBLISHED },
          { title: 'Published 2', content: 'C3', slug: `p2-${Date.now()}`, category: PostCategory.TYPESCRIPT, status: PostStatus.PUBLISHED },
        ],
      });

      const published = await prisma.blogPost.findMany({
        where: { status: PostStatus.PUBLISHED },
      });

      expect(published).toHaveLength(2);
    });

    it('should query posts scheduled for publishing', async () => {
      const pastDate = new Date(Date.now() - 60000);
      const futureDate = new Date(Date.now() + 3600000);

      await prisma.blogPost.createMany({
        data: [
          { title: 'Due Post', content: 'C1', slug: `due-${Date.now()}`, category: PostCategory.FRONTEND, status: PostStatus.SCHEDULED, scheduledFor: pastDate },
          { title: 'Future Post', content: 'C2', slug: `future-${Date.now()}`, category: PostCategory.FRONTEND, status: PostStatus.SCHEDULED, scheduledFor: futureDate },
        ],
      });

      const duePosts = await prisma.blogPost.findMany({
        where: {
          status: PostStatus.SCHEDULED,
          scheduledFor: { lte: new Date() },
        },
      });

      expect(duePosts).toHaveLength(1);
      expect(duePosts[0].title).toBe('Due Post');
    });
  });

  // ── TopicQueue Model ───────────────────────────────────────────

  describe('TopicQueue CRUD', () => {
    it('should create a topic', async () => {
      const topic = await prisma.topicQueue.create({
        data: {
          topic: 'React Server Components Performance Tips',
          category: PostCategory.FRONTEND,
          priority: 5,
        },
      });

      expect(topic.id).toBeTruthy();
      expect(topic.used).toBe(false);
      expect(topic.usedAt).toBeNull();
    });

    it('should query unused topics sorted by priority', async () => {
      await prisma.topicQueue.createMany({
        data: [
          { topic: 'Low priority topic about React patterns', category: PostCategory.FRONTEND, priority: 1 },
          { topic: 'High priority topic about TypeScript generics', category: PostCategory.TYPESCRIPT, priority: 10 },
          { topic: 'Medium priority topic about JavaScript closures', category: PostCategory.JAVASCRIPT, priority: 5 },
        ],
      });

      const topics = await prisma.topicQueue.findMany({
        where: { used: false },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });

      expect(topics).toHaveLength(3);
      expect(topics[0].priority).toBe(10);
      expect(topics[2].priority).toBe(1);
    });

    it('should mark a topic as used', async () => {
      const topic = await prisma.topicQueue.create({
        data: {
          topic: 'JavaScript Event Loop explanation deep dive',
          category: PostCategory.JAVASCRIPT,
        },
      });

      const updated = await prisma.topicQueue.update({
        where: { id: topic.id },
        data: { used: true, usedAt: new Date() },
      });

      expect(updated.used).toBe(true);
      expect(updated.usedAt).toBeInstanceOf(Date);
    });

    it('should count topics by category', async () => {
      await prisma.topicQueue.createMany({
        data: [
          { topic: 'JS topic one about closures in practice', category: PostCategory.JAVASCRIPT },
          { topic: 'JS topic two about async patterns', category: PostCategory.JAVASCRIPT },
          { topic: 'TS topic one about type inference tricks', category: PostCategory.TYPESCRIPT },
          { topic: 'FE topic one about CSS grid advanced layouts', category: PostCategory.FRONTEND },
        ],
      });

      const [jsCount, tsCount, feCount] = await Promise.all([
        prisma.topicQueue.count({ where: { category: PostCategory.JAVASCRIPT, used: false } }),
        prisma.topicQueue.count({ where: { category: PostCategory.TYPESCRIPT, used: false } }),
        prisma.topicQueue.count({ where: { category: PostCategory.FRONTEND, used: false } }),
      ]);

      expect(jsCount).toBe(2);
      expect(tsCount).toBe(1);
      expect(feCount).toBe(1);
    });
  });

  // ── PublishLog Model ───────────────────────────────────────────

  describe('PublishLog', () => {
    it('should create a publish log entry linked to a post', async () => {
      const post = await prisma.blogPost.create({
        data: {
          title: 'Post for Log',
          content: 'Content',
          slug: `log-post-${Date.now()}`,
          category: PostCategory.JAVASCRIPT,
        },
      });

      const log = await prisma.publishLog.create({
        data: {
          postId: post.id,
          success: true,
        },
      });

      expect(log.id).toBeTruthy();
      expect(log.success).toBe(true);
      expect(log.errorMessage).toBeNull();
    });

    it('should cascade delete logs when post is deleted', async () => {
      const post = await prisma.blogPost.create({
        data: {
          title: 'Post to Delete',
          content: 'Will be deleted.',
          slug: `del-post-${Date.now()}`,
          category: PostCategory.FRONTEND,
        },
      });

      await prisma.publishLog.create({
        data: { postId: post.id, success: false, errorMessage: 'Test error' },
      });

      await prisma.blogPost.delete({ where: { id: post.id } });

      const orphanedLogs = await prisma.publishLog.findMany({
        where: { postId: post.id },
      });

      expect(orphanedLogs).toHaveLength(0);
    });
  });

  // ── SystemConfig Model ─────────────────────────────────────────

  describe('SystemConfig', () => {
    afterEach(async () => {
      await prisma.systemConfig.deleteMany({});
    });

    it('should store and retrieve key-value config', async () => {
      await prisma.systemConfig.create({
        data: {
          key: 'last_generation_run',
          value: { timestamp: new Date().toISOString(), status: 'success' },
        },
      });

      const config = await prisma.systemConfig.findUnique({
        where: { key: 'last_generation_run' },
      });

      expect(config).toBeDefined();
      const val = config!.value as Record<string, unknown>;
      expect(val.status).toBe('success');
    });

    it('should enforce unique key constraint', async () => {
      await prisma.systemConfig.create({
        data: { key: 'test_key', value: { v: 1 } },
      });

      await expect(
        prisma.systemConfig.create({
          data: { key: 'test_key', value: { v: 2 } },
        }),
      ).rejects.toThrow();
    });
  });
});
