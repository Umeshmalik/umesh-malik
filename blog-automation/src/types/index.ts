// ============================================
// Blog Automation - Type Definitions
// ============================================

// ── Configuration ───────────────────────────────────────────────────

/** Configuration for the AI content generation service */
export interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature?: number;
}

/** Supported CMS/website platform types */
export type WebsiteType = 'wordpress' | 'custom' | 'static';

/** Configuration for the website/CMS publishing target */
export interface WebsiteConfig {
  /** CMS platform type */
  type: WebsiteType;
  /** Base API URL for the CMS */
  apiUrl: string;
  /** API key or bearer token */
  apiKey: string;
  /** WordPress username (required for wordpress type) */
  wpUsername?: string;
  /** WordPress application password (required for wordpress type) */
  wpAppPassword?: string;
  /** Git repository URL (required for static type) */
  gitRepoUrl?: string;
  /** Git branch to publish to (default: main) */
  gitBranch?: string;
  /** GitHub personal access token (required for static type) */
  gitToken?: string;
  /** When true, simulate publishing without actually making changes */
  dryRun: boolean;
  /** HTTP request timeout in ms */
  timeout: number;
}

/** Configuration for the BlogScheduler */
export interface SchedulerConfig {
  /** Number of blog posts to generate per day (default: 2) */
  postsPerDay: number;
  /** Earliest hour (0-23) a post can be scheduled (default: 9 = 9 AM) */
  windowStartHour: number;
  /** Latest hour (0-23) a post can be scheduled (default: 21 = 9 PM) */
  windowEndHour: number;
  /** Minimum hours between two scheduled posts (default: 4) */
  minSpacingHours: number;
  /** Skip generating posts on Saturday and Sunday (default: false) */
  skipWeekends: boolean;
  /** IANA timezone for the scheduling window (default: America/New_York) */
  timezone: string;
  /** Cron expression for the daily content generation run (default: 0 2 * * *) */
  generationCron: string;
  /** Cron expression for the hourly publish check (default: 0 * * * *) */
  publishCheckCron: string;
  /** Port for the HTTP health check endpoint (default: 3000) */
  healthCheckPort: number;
}

/** Content generation settings */
export interface ContentConfig {
  /** Default language for generated content (default: en) */
  defaultLanguage: string;
  /** Minimum word count for generated blog posts (default: 1500) */
  minWords: number;
  /** Maximum word count for generated blog posts (default: 2500) */
  maxWords: number;
  /** Active blog categories */
  categories: readonly PostCategoryType[];
}

/** Full application configuration */
export interface AppConfig {
  ai: AIConfig;
  website: WebsiteConfig;
  database: {
    url: string;
  };
  scheduling: SchedulerConfig;
  content: ContentConfig;
  nodeEnv: string;
  logLevel: string;
}

// ── Health Check ────────────────────────────────────────────────────

/** Snapshot of the BlogScheduler's operational state */
export interface HealthStatus {
  /** Whether the scheduler is running (not shutting down) */
  running: boolean;
  /** Number of jobs currently executing */
  activeJobs: number;
  /** Number of registered cron tasks */
  registeredCrons: number;
  /** Posts generated today */
  postsGeneratedToday: number;
  /** Posts published today */
  postsPublishedToday: number;
  /** Posts currently waiting to publish */
  postsScheduledPending: number;
  /** Configured posts-per-day target */
  postsPerDayTarget: number;
  /** Scheduler uptime in seconds */
  uptimeSeconds: number;
  /** Current server time (ISO 8601) */
  serverTime: string;
  /** Configured timezone */
  timezone: string;
}

// ── Research ────────────────────────────────────────────────────────

/** Configuration for the ResearchService */
export interface ResearchConfig {
  /** Maximum number of sources to gather per topic (default: 10) */
  maxSources: number;
  /** Timeout in ms for web search requests (default: 15000) */
  searchTimeout: number;
  /** Claude model to use for analysis (default: from env) */
  claudeModel: string;
  /** Maximum tokens for Claude analysis response (default: 4096) */
  maxTokens: number;
  /** Minimum interval in ms between API calls for rate limiting (default: 1000) */
  rateLimitMs: number;
  /** Maximum retry attempts for failed API calls (default: 3) */
  maxRetries: number;
  /** Base delay in ms for exponential backoff between retries (default: 1000) */
  retryBaseDelayMs: number;
}

/** A single research source gathered from web search */
export interface Source {
  /** Title of the source article/page */
  title: string;
  /** URL of the source */
  url: string;
  /** Text snippet or description from the source */
  snippet: string;
  /** When the source was published (if available) */
  publishedDate?: string;
  /** Relevance score from 0 to 1 (higher = more relevant) */
  relevanceScore: number;
}

/** Structured result returned by ResearchService.researchTopic() */
export interface ResearchResult {
  /** The topic that was researched */
  topic: string;
  /** The category of the topic */
  category: string;
  /** Key insights discovered during research */
  mainInsights: string[];
  /** Current trends related to the topic */
  currentTrends: string[];
  /** Relevant code examples found or generated */
  codeExamples: string[];
  /** Recommended best practices */
  bestPractices: string[];
  /** Common mistakes and pitfalls to avoid */
  commonPitfalls: string[];
  /** All gathered sources with metadata */
  sources: Source[];
  /** AI-generated summary of all findings */
  summary: string;
  /** Timestamp when research was completed */
  researchedAt: Date;
}

// ── Content Generation ──────────────────────────────────────────────

/** Prompt context passed to the AI for content generation */
export interface GenerationPrompt {
  topic: string;
  category: PostCategoryType;
  keywords: string[];
  tone?: ContentTone;
  targetLength?: number;
  additionalContext?: string;
}

/** Result of AI content generation (legacy, used by ai.service.ts) */
export interface GeneratedContent {
  title: string;
  content: string;
  slug: string;
  category: PostCategoryType;
  researchSources: Source[];
  metadata: PostMetadata;
}

/** SEO and tag metadata stored as JSON on the BlogPost (legacy) */
export interface PostMetadata {
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  excerpt: string;
  readingTimeMinutes?: number;
  ogImage?: string;
}

// ── Content Generator (BlogContent) ─────────────────────────────────

/** SEO metadata for a blog post, returned by ContentGenerator */
export interface SEOMetadata {
  /** SEO-optimized page title (max 60 characters) */
  metaTitle: string;
  /** SEO meta description (max 155 characters) */
  metaDescription: string;
  /** Categorization tags */
  tags: string[];
  /** Short excerpt / summary (max 160 characters) */
  excerpt: string;
  /** Estimated reading time in minutes */
  readingTimeMinutes: number;
  /** Primary keyword the post targets */
  focusKeyword?: string;
}

/**
 * Full blog content returned by ContentGenerator.generateBlogPost().
 * This is the primary type flowing through the generation pipeline.
 */
export interface BlogContent {
  /** Blog post title */
  title: string;
  /** URL-safe slug derived from the title */
  slug: string;
  /** Full markdown body of the post */
  content: string;
  /** Post category */
  category: PostCategoryType;
  /** Parsed sections for structural validation */
  sections: ContentSection[];
  /** Word count of the post body (excluding code blocks) */
  wordCount: number;
  /** Number of fenced code blocks in the post */
  codeBlockCount: number;
  /** Research sources used during generation */
  researchSources: Source[];
  /** SEO metadata */
  seo: SEOMetadata;
  /** Timestamp when content was generated */
  generatedAt: Date;
}

/** A parsed section from the markdown content */
export interface ContentSection {
  /** Heading text (without the ## prefix) */
  heading: string;
  /** Heading level (2 for ##, 3 for ###) */
  level: number;
  /** Raw markdown body of the section */
  body: string;
  /** Whether the section contains at least one fenced code block */
  hasCodeBlock: boolean;
}

/** Result of content validation checks */
export interface ContentValidationResult {
  /** Whether all critical checks passed */
  isValid: boolean;
  /** Actual word count */
  wordCount: number;
  /** Number of fenced code blocks */
  codeBlockCount: number;
  /** Number of ## level sections */
  sectionCount: number;
  /** Critical issues that must be fixed */
  errors: string[];
  /** Non-critical issues worth noting */
  warnings: string[];
}

// ── Publishing (CMS Adapter Pattern) ────────────────────────────────

/** Configuration for the PublishService */
export interface PublishConfig {
  type: WebsiteType;
  apiUrl: string;
  apiKey: string;
  wpUsername?: string;
  wpAppPassword?: string;
  gitRepoUrl?: string;
  gitBranch?: string;
  gitToken?: string;
  dryRun: boolean;
  timeout: number;
  maxRetries: number;
}

/** Result returned by PublishService.publishToWebsite() */
export interface PublishResult {
  success: boolean;
  postId?: string;
  url?: string;
  publishedAt?: Date;
  error?: string;
  dryRun: boolean;
  adapter: WebsiteType;
  durationMs: number;
}

/** An image to upload to the CMS */
export interface Image {
  filename: string;
  data: Buffer;
  mimeType: string;
  altText?: string;
}

/** CMS adapter interface */
export interface CMSAdapter {
  readonly adapterName: WebsiteType;
  publish(post: CMSPostPayload): Promise<CMSPublishResponse>;
  update(postId: string, post: CMSPostPayload): Promise<CMSPublishResponse>;
  delete(postId: string): Promise<void>;
  uploadImage(image: Image): Promise<string>;
  validateConnection(): Promise<boolean>;
}

/** Platform-agnostic post payload sent to CMS adapters */
export interface CMSPostPayload {
  title: string;
  content: string;
  slug: string;
  status: 'draft' | 'publish';
  category?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  featuredImageUrl?: string;
}

/** Response from a CMS adapter after creating/updating a post */
export interface CMSPublishResponse {
  id: string;
  url: string;
  status: string;
}

// ── Legacy Publishing Types ─────────────────────────────────────────

/** @deprecated Use PublishResult */
export interface PublishPayload {
  title: string;
  content: string;
  slug: string;
  category: PostCategoryType;
  metadata: PostMetadata;
  status: 'draft' | 'publish';
}

/** @deprecated Use PublishResult */
export interface PublishResponse {
  id: string;
  url: string;
  status: string;
}

// ── Enums & Unions ──────────────────────────────────────────────────

/** Mirrors the PostCategory Prisma enum */
export type PostCategoryType = 'JAVASCRIPT' | 'TYPESCRIPT' | 'FRONTEND';

/** Alias for PostCategoryType — used by TopicManager for clarity */
export type TopicCategory = PostCategoryType;

/** All supported categories as a runtime array (for iteration) */
export const ALL_CATEGORIES: readonly TopicCategory[] = [
  'JAVASCRIPT',
  'TYPESCRIPT',
  'FRONTEND',
] as const;

/** Supported content tones */
export type ContentTone =
  | 'professional'
  | 'casual'
  | 'technical'
  | 'educational'
  | 'conversational';

// ── Topic Management ────────────────────────────────────────────────

/** A topic from the TopicQueue, enriched with metadata */
export interface Topic {
  /** Database ID (UUID) */
  id: string;
  /** The topic title / description */
  topic: string;
  /** Category the topic belongs to */
  category: TopicCategory;
  /** Priority score (higher = picked sooner) */
  priority: number;
  /** Whether the topic has been used to generate a post */
  used: boolean;
  /** When the topic was consumed */
  usedAt: Date | null;
  /** When the topic was added to the queue */
  createdAt: Date;
}

/** Configuration for the TopicManager class */
export interface TopicManagerConfig {
  /** Minimum number of unused topics to keep in the queue (default: 30) */
  minQueueSize: number;
  /** Threshold below which auto-refresh triggers (default: 10) */
  lowQueueThreshold: number;
  /** Number of topics to generate per Claude call (default: 20) */
  topicsPerGeneration: number;
  /** Claude model to use for topic generation (default: from env) */
  claudeModel: string;
  /** Max tokens for topic generation response (default: 4096) */
  maxTokens: number;
  /** Minimum interval in ms between Claude calls (default: 1000) */
  rateLimitMs: number;
  /** Max retry attempts for failed API calls (default: 3) */
  maxRetries: number;
  /** Similarity threshold (0-1) above which a topic is considered duplicate (default: 0.6) */
  similarityThreshold: number;
}

/** Result of validating a single topic candidate */
export interface TopicValidationResult {
  /** Whether the topic passed all validation checks */
  isValid: boolean;
  /** The topic string that was validated */
  topic: string;
  /** Reasons the topic was rejected (empty if valid) */
  rejectionReasons: string[];
}

/** Result of a batch topic generation call */
export interface TopicGenerationResult {
  /** Topics that were added to the queue */
  added: Topic[];
  /** Topics that were rejected as duplicates or invalid */
  rejected: Array<{ topic: string; reason: string }>;
  /** Total candidates returned by Claude */
  candidateCount: number;
  /** Category distribution of added topics */
  categoryBreakdown: Record<TopicCategory, number>;
}

/** Snapshot of the topic queue's current state */
export interface TopicQueueStats {
  /** Total topics in the queue (used + unused) */
  total: number;
  /** Unused topics available */
  unused: number;
  /** Used (consumed) topics */
  used: number;
  /** Breakdown of unused topics per category */
  unusedByCategory: Record<TopicCategory, number>;
  /** Whether auto-refresh is needed */
  needsRefresh: boolean;
}

// ── Status Dashboard ────────────────────────────────────────────────

/** Rich status snapshot returned by GET /status */
export interface StatusDashboard {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'error';
  /** System uptime in seconds */
  uptimeSeconds: number;
  /** Current server time (ISO 8601) */
  serverTime: string;
  /** Configured timezone */
  timezone: string;

  /** Database connectivity */
  database: {
    connected: boolean;
    latencyMs: number;
  };

  /** Today's publishing metrics */
  today: {
    postsGenerated: number;
    postsPublished: number;
    postsFailed: number;
  };

  /** Scheduled posts waiting to publish */
  scheduled: {
    pending: number;
    nextPublishAt: string | null;
  };

  /** Topic queue health */
  topicQueue: {
    unusedTotal: number;
    unusedByCategory: Record<TopicCategory, number>;
    needsRefresh: boolean;
  };

  /** Most recent publish error (if any) */
  lastError: {
    message: string | null;
    postId: string | null;
    occurredAt: string | null;
  };

  /** Scheduler state */
  scheduler: {
    running: boolean;
    activeJobs: number;
    registeredCrons: number;
    postsPerDayTarget: number;
  };
}

// ── Scheduling (legacy) ─────────────────────────────────────────────

/** @deprecated Use SchedulerConfig */
export interface SchedulerJob {
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  enabled: boolean;
}

// ── Logging ─────────────────────────────────────────────────────────

/** Log metadata for structured logging */
export interface LogMeta {
  service?: string;
  action?: string;
  postId?: string;
  topicId?: string;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}
