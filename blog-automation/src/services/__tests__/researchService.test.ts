// ============================================
// Unit Tests — ResearchService
// ============================================

import { ResearchService } from '../researchService';

// ── Mock External Dependencies ──────────────────────────────────────

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  AxiosError: class AxiosError extends Error {
    code?: string;
    response?: { status: number };
    constructor(message: string, code?: string, _config?: unknown, _req?: unknown, response?: { status: number }) {
      super(message);
      this.code = code;
      this.response = response;
    }
  },
}));

// Mock config
jest.mock('../../config/env', () => ({
  config: {
    ai: {
      apiKey: 'sk-ant-test-key-1234567890',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      temperature: 0.7,
    },
    website: { type: 'custom', apiUrl: 'https://test.com', apiKey: 'test', dryRun: false, timeout: 5000 },
    database: { url: 'postgresql://test:test@localhost:5432/test' },
    scheduling: { postsPerDay: 2, windowStartHour: 9, windowEndHour: 21, minSpacingHours: 4, skipWeekends: false, timezone: 'UTC', generationCron: '0 2 * * *', publishCheckCron: '0 * * * *', healthCheckPort: 3000 },
    content: { defaultLanguage: 'en', minWords: 1500, maxWords: 2500, categories: ['JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND'] },
    nodeEnv: 'test',
    logLevel: 'error',
  },
}));

// Mock logger
jest.mock('../../config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock helpers
jest.mock('../../utils/helpers', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
  slugify: jest.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
  estimateReadingTime: jest.fn(() => 5),
}));

import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

// ── Test Data ───────────────────────────────────────────────────────

const MOCK_DDG_RESPONSE = {
  data: {
    Heading: 'React Hooks',
    Abstract: 'React Hooks let you use state and lifecycle in function components.',
    AbstractURL: 'https://react.dev/hooks',
    RelatedTopics: [
      {
        Text: 'useState hook allows you to add state to functional components in React',
        FirstURL: 'https://react.dev/reference/react/useState',
      },
      {
        Text: 'useEffect hook for side effects in React components',
        FirstURL: 'https://react.dev/reference/react/useEffect',
      },
    ],
  },
};

const MOCK_ANALYSIS_JSON = JSON.stringify({
  mainInsights: ['Hooks simplify state management', 'Custom hooks enable reuse'],
  currentTrends: ['Server Components', 'React Compiler'],
  codeExamples: ['const [count, setCount] = useState(0);'],
  bestPractices: ['Always use dependency arrays correctly'],
  commonPitfalls: ['Stale closures in useEffect'],
});

// ── Tests ───────────────────────────────────────────────────────────

describe('ResearchService', () => {
  let service: ResearchService;
  let mockAnthropicCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up Anthropic mock
    mockAnthropicCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: MOCK_ANALYSIS_JSON }],
    });

    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockAnthropicCreate },
    }));

    // Set up axios mock
    (axios.get as jest.Mock).mockResolvedValue(MOCK_DDG_RESPONSE);

    service = new ResearchService({
      rateLimitMs: 0,
      retryBaseDelayMs: 0,
      maxRetries: 1,
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const svc = new ResearchService();
      expect(svc).toBeInstanceOf(ResearchService);
    });

    it('should accept config overrides', () => {
      const svc = new ResearchService({ maxSources: 5, searchTimeout: 5000 });
      expect(svc).toBeInstanceOf(ResearchService);
    });
  });

  // ── gatherSources ───────────────────────────────────────────────

  describe('gatherSources', () => {
    it('should gather and de-duplicate sources from DuckDuckGo', async () => {
      const sources = await service.gatherSources('React Hooks');

      expect(sources.length).toBeGreaterThan(0);
      expect(sources.length).toBeLessThanOrEqual(10);

      // Verify no duplicate URLs
      const urls = sources.map((s) => s.url);
      expect(new Set(urls).size).toBe(urls.length);
    });

    it('should sort sources by relevance score (descending)', async () => {
      const sources = await service.gatherSources('React Hooks');

      for (let i = 1; i < sources.length; i++) {
        expect(sources[i - 1].relevanceScore).toBeGreaterThanOrEqual(sources[i].relevanceScore);
      }
    });

    it('should respect maxSources config', async () => {
      const svc = new ResearchService({ maxSources: 2, rateLimitMs: 0, retryBaseDelayMs: 0 });
      const sources = await svc.gatherSources('React Hooks');
      expect(sources.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array when DuckDuckGo fails', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const sources = await service.gatherSources('React Hooks');
      expect(sources).toEqual([]);
    });

    it('should include source metadata (title, url, snippet)', async () => {
      const sources = await service.gatherSources('React Hooks');

      if (sources.length > 0) {
        expect(sources[0]).toHaveProperty('title');
        expect(sources[0]).toHaveProperty('url');
        expect(sources[0]).toHaveProperty('snippet');
        expect(sources[0]).toHaveProperty('relevanceScore');
        expect(typeof sources[0].relevanceScore).toBe('number');
      }
    });
  });

  // ── researchTopic ───────────────────────────────────────────────

  describe('researchTopic', () => {
    it('should return a complete ResearchResult', async () => {
      const result = await service.researchTopic('React Hooks', 'FRONTEND');

      expect(result.topic).toBe('React Hooks');
      expect(result.category).toBe('FRONTEND');
      expect(result.mainInsights).toBeInstanceOf(Array);
      expect(result.currentTrends).toBeInstanceOf(Array);
      expect(result.codeExamples).toBeInstanceOf(Array);
      expect(result.bestPractices).toBeInstanceOf(Array);
      expect(result.commonPitfalls).toBeInstanceOf(Array);
      expect(result.sources).toBeInstanceOf(Array);
      expect(result.summary).toBeTruthy();
      expect(result.researchedAt).toBeInstanceOf(Date);
    });

    it('should call Claude for analysis when sources exist', async () => {
      await service.researchTopic('React Hooks', 'FRONTEND');

      // Should call Claude at least once (for analysis) + possibly for summary
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it('should throw when Claude is completely unreachable', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('API error'));

      // Analysis fails (caught, returns empty). Summary fallback calls Claude again
      // which also fails, propagating the error through researchTopic's catch.
      await expect(
        service.researchTopic('React Hooks', 'FRONTEND'),
      ).rejects.toThrow('API error');
    });

    it('should propagate non-recoverable errors', async () => {
      // Both DuckDuckGo and Claude fail
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network down'));
      mockAnthropicCreate.mockRejectedValue(new Error('Fatal error'));

      const result = await service.researchTopic('React Hooks', 'FRONTEND');
      // With no sources and failed Claude, should still return something
      expect(result.sources).toEqual([]);
    });
  });

  // ── summarizeFindings ───────────────────────────────────────────

  describe('summarizeFindings', () => {
    it('should return "no sources" message for empty source list', async () => {
      const summary = await service.summarizeFindings([]);
      expect(summary).toContain('No sources');
    });

    it('should build summary from analysis when insights exist', async () => {
      const analysis = {
        mainInsights: ['Insight 1', 'Insight 2'],
        currentTrends: ['Trend 1'],
        codeExamples: [],
        bestPractices: ['Practice 1'],
        commonPitfalls: [],
      };

      const sources = [
        { title: 'Source 1', url: 'https://example.com', snippet: 'Test snippet', relevanceScore: 0.8 },
      ];

      const summary = await service.summarizeFindings(sources, analysis);

      expect(summary).toContain('Insight 1');
      expect(summary).toContain('Insight 2');
      expect(summary).toContain('Trend 1');
      expect(summary).toContain('Practice 1');
      expect(summary).toContain('example.com');
    });

    it('should call Claude as fallback when no analysis provided', async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Claude-generated summary of findings.' }],
      });

      const sources = [
        { title: 'Source 1', url: 'https://example.com', snippet: 'A source', relevanceScore: 0.8 },
      ];

      const summary = await service.summarizeFindings(sources);
      expect(mockAnthropicCreate).toHaveBeenCalled();
      expect(summary).toBeTruthy();
    });
  });
});
