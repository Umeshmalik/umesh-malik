// ============================================
// Integration Tests — Full Blog Workflow
// ============================================
//
// End-to-end test of the complete blog automation pipeline:
//   Topic Selection → Research → Content Generation → Publishing
//
// All external services (Claude, DuckDuckGo, CMS) are mocked.
// The database layer uses the real Prisma client against a test DB.
//
// ============================================

// ── Mock External Dependencies BEFORE imports ───────────────────────

const mockAnthropicCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicCreate },
  }));
});

const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('axios', () => ({
  get: jest.fn(),
  create: jest.fn(() => mockAxiosInstance),
  AxiosError: class AxiosError extends Error {
    code?: string;
    response?: { status: number };
    constructor(message: string) {
      super(message);
    }
  },
}));

jest.mock('../../src/config/env', () => ({
  config: {
    ai: { apiKey: 'sk-ant-test-key-1234567890', model: 'claude-sonnet-4-20250514', maxTokens: 4096, temperature: 0.7 },
    website: {
      type: 'custom',
      apiUrl: 'https://api.test.com',
      apiKey: 'test-key',
      dryRun: true, // Use dry-run for integration tests
      timeout: 5000,
    },
    database: { url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/blog_automation_test' },
    scheduling: { postsPerDay: 2, windowStartHour: 9, windowEndHour: 21, minSpacingHours: 4, skipWeekends: false, timezone: 'UTC', generationCron: '0 2 * * *', publishCheckCron: '0 * * * *', healthCheckPort: 3001 },
    content: { defaultLanguage: 'en', minWords: 1500, maxWords: 2500, categories: ['JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND'] },
    nodeEnv: 'test',
    logLevel: 'error',
  },
}));

jest.mock('../../src/config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../src/utils/helpers', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
  slugify: jest.fn((text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')),
  estimateReadingTime: jest.fn(() => 7),
}));

jest.mock('../../src/utils/formatters', () => ({
  normalizeMarkdown: jest.fn((md: string) => md.trim()),
  formatPostDate: jest.fn(() => 'January 1, 2025'),
  formatRelativeDate: jest.fn(() => '2 hours ago'),
}));

import axios from 'axios';

// ── Mock Data ───────────────────────────────────────────────────────

function buildMockBlogContentMarkdown(): string {
  const paragraphs = Array.from({ length: 25 }, (_, i) =>
    `Paragraph ${i + 1} discusses important concepts about TypeScript generics and their practical applications in modern frontend development with detailed explanations and examples that developers can immediately apply.`
  ).join('\n\n');

  return `TypeScript generics are one of the most powerful features of the type system. They allow developers to create reusable components that work with any data type while maintaining full type safety.

## Understanding Generic Basics

${paragraphs.slice(0, 500)}

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}
const result = identity<string>("hello");
\`\`\`

## Advanced Generic Patterns

Conditional types and mapped types take generics to the next level.

\`\`\`typescript
type IsString<T> = T extends string ? true : false;
type Result = IsString<"hello">; // true
\`\`\`

## Generic Constraints

Using extends to constrain generic types.

\`\`\`typescript
interface HasLength { length: number; }
function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}
\`\`\`

## Best Practices

Follow these patterns for maintainable generic code.

\`\`\`typescript
// Named generics for clarity
type Result<TData, TError = Error> = { data: TData } | { error: TError };
\`\`\`

## Conclusion and Key Takeaways

${paragraphs.slice(500, 900)}

- Use generics for reusable type-safe code
- Constrain generics with extends
- Prefer named type parameters
- Use conditional types for advanced patterns`;
}

const MOCK_DDG_RESPONSE = {
  data: {
    Heading: 'TypeScript Generics',
    Abstract: 'Generics provide a way to make components work with any data type.',
    AbstractURL: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
    RelatedTopics: [
      { Text: 'Generic constraints in TypeScript', FirstURL: 'https://example.com/constraints' },
    ],
  },
};

const MOCK_RESEARCH_JSON = JSON.stringify({
  mainInsights: ['Generics improve code reusability', 'Type inference works with generics'],
  currentTrends: ['Conditional types', 'Template literal types'],
  codeExamples: ['function id<T>(x: T): T { return x; }'],
  bestPractices: ['Name generic parameters descriptively'],
  commonPitfalls: ['Over-constraining generics'],
});

const MOCK_CONTENT_JSON = JSON.stringify({
  title: 'Mastering TypeScript Generics: A Complete Guide',
  content: buildMockBlogContentMarkdown(),
  excerpt: 'Learn TypeScript generics from basics to advanced patterns.',
  metaTitle: 'TypeScript Generics Guide',
  metaDescription: 'Comprehensive guide to TypeScript generics with real-world examples.',
  tags: ['typescript', 'generics', 'type-system'],
});

const MOCK_SEO_JSON = JSON.stringify({
  metaTitle: 'TypeScript Generics: The Definitive Guide',
  metaDescription: 'Master TypeScript generics with practical code examples.',
  tags: ['typescript', 'generics', 'types', 'frontend'],
  excerpt: 'Everything about TypeScript generics.',
  focusKeyword: 'TypeScript generics',
});

const MOCK_TOPICS_JSON = JSON.stringify({
  topics: [
    { topic: 'Advanced TypeScript Conditional Types Deep Dive', category: 'TYPESCRIPT' },
    { topic: 'JavaScript WeakRef and FinalizationRegistry Patterns', category: 'JAVASCRIPT' },
    { topic: 'Building Accessible React Navigation Components', category: 'FRONTEND' },
  ],
});

// ── Tests ───────────────────────────────────────────────────────────

describe('Full Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up DuckDuckGo mock
    (axios.get as jest.Mock).mockResolvedValue(MOCK_DDG_RESPONSE);

    // Set up sequential Claude responses
    mockAnthropicCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_RESEARCH_JSON }] })   // Research analysis
      .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_CONTENT_JSON }] })    // Content generation
      .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_SEO_JSON }] });        // SEO optimization

    // CMS mock
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });
    mockAxiosInstance.post.mockResolvedValue({
      data: { id: 'cms-1', url: 'https://test.com/post', status: 'publish' },
    });
  });

  describe('Research → Generate → Publish Pipeline', () => {
    it('should complete the full pipeline from research to content generation', async () => {
      // Import services after mocks are set up
      const { ResearchService } = require('../../src/services/researchService');
      const { ContentGenerator } = require('../../src/services/contentGenerator');

      // Step 1: Research
      const researchService = new ResearchService({ rateLimitMs: 0, retryBaseDelayMs: 0, maxRetries: 1 });
      const research = await researchService.researchTopic('TypeScript Generics', 'TYPESCRIPT');

      expect(research.topic).toBe('TypeScript Generics');
      expect(research.sources.length).toBeGreaterThan(0);
      expect(research.mainInsights.length).toBeGreaterThan(0);

      // Step 2: Generate content
      const contentGenerator = new ContentGenerator();

      // Reset mock for content generator's Claude calls
      mockAnthropicCreate
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_CONTENT_JSON }] })
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_SEO_JSON }] });

      const blogContent = await contentGenerator.generateBlogPost(research, 'TypeScript Generics');

      expect(blogContent.title).toBeTruthy();
      expect(blogContent.content).toBeTruthy();
      expect(blogContent.slug).toBeTruthy();
      expect(blogContent.category).toBe('TYPESCRIPT');
      expect(blogContent.seo).toBeDefined();
      expect(blogContent.seo.tags.length).toBeGreaterThan(0);
    });

    it('should generate and validate content structure', async () => {
      const { ContentGenerator } = require('../../src/services/contentGenerator');

      mockAnthropicCreate
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_CONTENT_JSON }] })
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_SEO_JSON }] });

      const contentGenerator = new ContentGenerator();
      const research = {
        topic: 'TypeScript Generics',
        category: 'TYPESCRIPT',
        mainInsights: ['Generics improve reusability'],
        currentTrends: ['Conditional types'],
        codeExamples: [],
        bestPractices: ['Name type params'],
        commonPitfalls: ['Over-constraining'],
        sources: [{ title: 'TS Docs', url: 'https://ts.dev', snippet: 'Docs', relevanceScore: 1 }],
        summary: 'Generics are powerful.',
        researchedAt: new Date(),
      };

      const content = await contentGenerator.generateBlogPost(research, 'TypeScript Generics');

      // Structural validation
      expect(content.sections.length).toBeGreaterThan(0);
      expect(content.wordCount).toBeGreaterThan(0);
      expect(content.codeBlockCount).toBeGreaterThan(0);
      expect(content.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Topic Generation Workflow', () => {
    it('should generate topic ideas via Claude', async () => {
      mockAnthropicCreate.mockReset().mockResolvedValueOnce({
        content: [{ type: 'text', text: MOCK_TOPICS_JSON }],
      });

      const { TopicManager } = require('../../src/services/topicManager');
      const topicManager = new TopicManager({ rateLimitMs: 0, maxRetries: 1 });

      const result = await topicManager.generateTopicIdeas(3);

      expect(result.candidateCount).toBeGreaterThan(0);
      expect(result.added.length + result.rejected.length).toBe(result.candidateCount);
    });
  });

  describe('Publish Service Dry Run', () => {
    it('should simulate publishing in dry-run mode', async () => {
      const { PublishService } = require('../../src/services/publishService');
      const publishService = new PublishService();

      const mockPost = {
        id: 'test-post-id',
        title: 'Test Post',
        content: '## Test\nContent here',
        slug: 'test-post',
        category: 'FRONTEND',
        status: 'DRAFT',
        metadata: { metaTitle: 'Test', tags: ['test'] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await publishService.publishToWebsite(mockPost as any);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      // Should not have hit the actual CMS
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should handle research failure gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockAnthropicCreate.mockReset();
      // Analysis returns empty when no sources
      // Summary fallback call also fails
      mockAnthropicCreate.mockRejectedValue(new Error('Claude error'));

      const { ResearchService } = require('../../src/services/researchService');
      const service = new ResearchService({ rateLimitMs: 0, retryBaseDelayMs: 0, maxRetries: 0 });

      // Should still return a result (with empty sources and analysis)
      const result = await service.researchTopic('Failing Topic', 'JAVASCRIPT');
      expect(result.sources).toEqual([]);
    });
  });
});
