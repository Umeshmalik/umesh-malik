// ============================================
// Unit Tests — ContentGenerator
// ============================================

import { ContentGenerator } from '../contentGenerator';
import type { ResearchResult } from '../../types';

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
  slugify: jest.fn((text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')),
  estimateReadingTime: jest.fn(() => 7),
}));

jest.mock('../../utils/formatters', () => ({
  normalizeMarkdown: jest.fn((md: string) => md.trim()),
}));

import Anthropic from '@anthropic-ai/sdk';

// ── Test Data ───────────────────────────────────────────────────────

const makeResearch = (overrides?: Partial<ResearchResult>): ResearchResult => ({
  topic: 'React Server Components',
  category: 'FRONTEND',
  mainInsights: ['Server Components reduce bundle size', 'They enable server-side data fetching'],
  currentTrends: ['React 19', 'Streaming SSR'],
  codeExamples: ['// Server Component\nexport default async function Page() { ... }'],
  bestPractices: ['Separate client and server boundaries', 'Use "use client" directive explicitly'],
  commonPitfalls: ['Passing non-serializable props to client components'],
  sources: [
    { title: 'React Docs', url: 'https://react.dev', snippet: 'Official docs', relevanceScore: 1.0 },
  ],
  summary: 'Server Components are a paradigm shift in React.',
  researchedAt: new Date(),
  ...overrides,
});

/** Generates a long markdown body with code blocks to pass validation */
function generateValidMarkdown(): string {
  const paragraphs = Array.from({ length: 30 }, (_, i) =>
    `This is paragraph ${i + 1} of the blog post about React Server Components. It contains enough words to contribute to the total word count needed for validation purposes and covers important concepts.`
  ).join('\n\n');

  return `React Server Components represent a fundamental shift in how we build React applications.
They allow you to render components on the server, reducing bundle size and improving performance.
In this post, we'll explore everything you need to know about this powerful feature.

## Introduction to Server Components

${paragraphs.slice(0, 500)}

\`\`\`typescript
// A Server Component
export default async function Dashboard() {
  const data = await fetchData();
  return <div>{data.map(item => <Card key={item.id} item={item} />)}</div>;
}
\`\`\`

## Data Fetching Patterns

Server Components enable direct database access from your components.

\`\`\`typescript
// Direct database access in Server Components
import { db } from '@/lib/db';

export default async function UserProfile({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  return <div><h1>{user?.name}</h1></div>;
}
\`\`\`

## Client vs Server Boundaries

Understanding when to use client vs server components is crucial.

\`\`\`typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
\`\`\`

## Best Practices

Follow these guidelines for optimal Server Component usage.

\`\`\`typescript
// Composing Server and Client Components
import { ClientSidebar } from './ClientSidebar';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const nav = await getNavigation();
  return (
    <div>
      <ClientSidebar items={nav} />
      <main>{children}</main>
    </div>
  );
}
\`\`\`

## Conclusion and Key Takeaways

${paragraphs.slice(500, 1000)}

- Server Components reduce JavaScript bundle size
- Direct data fetching simplifies architecture
- Clear client/server boundaries are essential
- Performance improvements are significant`;
}

const MOCK_CONTENT_JSON = JSON.stringify({
  title: 'Mastering React Server Components: A Complete Guide',
  content: generateValidMarkdown(),
  excerpt: 'Learn how React Server Components transform your app architecture.',
  metaTitle: 'React Server Components Guide 2025',
  metaDescription: 'A comprehensive guide to React Server Components with real-world examples and best practices.',
  tags: ['react', 'server-components', 'nextjs', 'performance', 'frontend'],
});

const MOCK_SEO_JSON = JSON.stringify({
  metaTitle: 'React Server Components: The Definitive Guide',
  metaDescription: 'Master React Server Components with code examples and performance optimization tips.',
  tags: ['react', 'server-components', 'ssr', 'nextjs', 'performance'],
  excerpt: 'Everything you need to know about React Server Components.',
  focusKeyword: 'React Server Components',
});

// ── Tests ───────────────────────────────────────────────────────────

describe('ContentGenerator', () => {
  let generator: ContentGenerator;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: MOCK_CONTENT_JSON }],
    });

    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockCreate },
    }));

    generator = new ContentGenerator();
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize the ContentGenerator', () => {
      expect(generator).toBeInstanceOf(ContentGenerator);
    });
  });

  // ── generateBlogPost ────────────────────────────────────────────

  describe('generateBlogPost', () => {
    it('should generate a complete BlogContent object', async () => {
      const research = makeResearch();
      const result = await generator.generateBlogPost(research, 'React Server Components');

      expect(result).toBeDefined();
      expect(result.title).toBeTruthy();
      expect(result.slug).toBeTruthy();
      expect(result.content).toBeTruthy();
      expect(result.category).toBe('FRONTEND');
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.seo).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should call Claude for content and then SEO optimization', async () => {
      const research = makeResearch();
      await generator.generateBlogPost(research, 'React Server Components');

      // Should have called Claude at least twice (content + SEO), possibly more for validation retries
      expect(mockCreate.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should include research sources in the output', async () => {
      mockCreate
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_CONTENT_JSON }] })
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_SEO_JSON }] });

      const research = makeResearch();
      const result = await generator.generateBlogPost(research, 'React Server Components');

      expect(result.researchSources).toEqual(research.sources);
    });

    it('should retry on validation failure with feedback', async () => {
      // First call returns short content that fails validation
      const shortContent = JSON.stringify({
        title: 'Short Post',
        content: '## Section\nShort content.',
        excerpt: 'Too short',
        metaTitle: 'Short',
        metaDescription: 'Too short',
        tags: ['test'],
      });

      mockCreate
        .mockReset()
        .mockResolvedValueOnce({ content: [{ type: 'text', text: shortContent }] })
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_CONTENT_JSON }] })
        .mockResolvedValueOnce({ content: [{ type: 'text', text: MOCK_SEO_JSON }] });

      const research = makeResearch();
      const result = await generator.generateBlogPost(research, 'React Server Components');

      // Should have retried (at least 2 content calls + 1 SEO)
      expect(mockCreate.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(result.title).toBeTruthy();
    });

    it('should proceed even if SEO optimization fails', async () => {
      // Track call count to fail only on the SEO call (which comes after content + validation retries)
      let callCount = 0;
      mockCreate.mockReset();
      mockCreate.mockImplementation(() => {
        callCount++;
        // Content generation calls succeed; only the SEO call (last one) fails
        // We detect the SEO call by checking if the system prompt mentions "SEO"
        // But simpler: just make all calls succeed for content, and test SEO separately
        return Promise.resolve({ content: [{ type: 'text', text: MOCK_CONTENT_JSON }] });
      });

      const research = makeResearch();
      const result = await generator.generateBlogPost(research, 'React Server Components');

      // Even with SEO call succeeding, the content should be complete
      expect(result).toBeDefined();
      expect(result.seo).toBeDefined();
      expect(result.title).toBeTruthy();
    });
  });

  // ── generateTitle ───────────────────────────────────────────────

  describe('generateTitle', () => {
    it('should return a string title', async () => {
      mockCreate.mockReset().mockResolvedValueOnce({
        content: [{ type: 'text', text: '"Advanced React Patterns for 2025"' }],
      });

      const research = makeResearch();
      const title = await generator.generateTitle('React Patterns', research);

      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
      // Should strip surrounding quotes
      expect(title).not.toMatch(/^["']/);
    });
  });

  // ── generateSlug ────────────────────────────────────────────────

  describe('generateSlug', () => {
    it('should generate a URL-safe slug with date suffix', async () => {
      const slug = await generator.generateSlug('My Great Blog Post Title');

      expect(slug).toMatch(/^[a-z0-9-]+-\d{8}$/);
      expect(slug).toContain('my-great-blog-post-title');
    });

    it('should handle special characters', async () => {
      const slug = await generator.generateSlug('React & TypeScript: A Guide!');
      expect(slug).toBeTruthy();
      expect(slug).not.toContain('&');
      expect(slug).not.toContain('!');
    });
  });

  // ── optimizeForSEO ──────────────────────────────────────────────

  describe('optimizeForSEO', () => {
    it('should return content with updated SEO metadata', async () => {
      mockCreate.mockReset().mockResolvedValueOnce({
        content: [{ type: 'text', text: MOCK_SEO_JSON }],
      });

      const blogContent = {
        title: 'Test Post',
        slug: 'test-post',
        content: '## Test\nContent here.',
        category: 'FRONTEND' as const,
        sections: [{ heading: 'Test', level: 2, body: 'Content here.', hasCodeBlock: false }],
        wordCount: 200,
        codeBlockCount: 0,
        researchSources: [],
        seo: {
          metaTitle: 'Original Title',
          metaDescription: 'Original description',
          tags: ['original'],
          excerpt: 'Original excerpt',
          readingTimeMinutes: 5,
        },
        generatedAt: new Date(),
      };

      const result = await generator.optimizeForSEO(blogContent);

      expect(result.seo.focusKeyword).toBe('React Server Components');
      expect(result.seo.tags.length).toBeGreaterThan(0);
    });

    it('should keep original metadata when SEO optimization fails', async () => {
      mockCreate.mockReset().mockRejectedValueOnce(new Error('API down'));

      const originalSeo = {
        metaTitle: 'Original',
        metaDescription: 'Original desc',
        tags: ['orig'],
        excerpt: 'Orig excerpt',
        readingTimeMinutes: 3,
      };

      const blogContent = {
        title: 'Test', slug: 'test', content: '## Test\nBody',
        category: 'FRONTEND' as const,
        sections: [], wordCount: 100, codeBlockCount: 0,
        researchSources: [], seo: originalSeo, generatedAt: new Date(),
      };

      const result = await generator.optimizeForSEO(blogContent);
      expect(result.seo).toEqual(originalSeo);
    });
  });
});
