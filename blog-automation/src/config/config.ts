// ============================================
// Comprehensive Configuration Module
// ============================================
//
// Single source of truth for all application configuration.
//
// Responsibilities:
//   1. Load environment variables via dotenv
//   2. Parse, cast, and apply defaults
//   3. Export a fully-typed AppConfig object
//   4. Provide validateConfig() for startup checks
//      (required vars, format checks, range checks)
//
// Every other module should import `config` from here
// (or from env.ts which re-exports it).
// ============================================

import dotenv from 'dotenv';
import path from 'path';
import {
  AppConfig,
  WebsiteType,
  ALL_CATEGORIES,
} from '../types';

// ── Load .env ───────────────────────────────────────────────────────

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Env Helpers ─────────────────────────────────────────────────────

/**
 * Returns the value of an environment variable, or the default.
 * Throws if the variable is missing and no default is provided.
 */
function env(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Returns the value of an optional environment variable,
 * or undefined if it is not set.
 */
function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

/**
 * Parses an environment variable as an integer with a default.
 */
function envInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got "${raw}"`);
  }
  return parsed;
}

/**
 * Parses an environment variable as a boolean with a default.
 * Truthy values: "true", "1", "yes" (case-insensitive).
 */
function envBool(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  return ['true', '1', 'yes'].includes(raw.toLowerCase());
}

// ── Build Configuration ─────────────────────────────────────────────

/**
 * The application configuration object.
 * All values are resolved at module load time.
 */
export const config: AppConfig = {
  // ── AI / Anthropic ──────────────────────────────────────────────
  ai: {
    apiKey: env('ANTHROPIC_API_KEY'),
    model: env('CLAUDE_MODEL', 'claude-sonnet-4-20250514'),
    maxTokens: envInt('MAX_TOKENS', 4096),
    temperature: 0.7,
  },

  // ── Website / CMS Publishing ────────────────────────────────────
  website: {
    type: env('WEBSITE_TYPE', 'custom') as WebsiteType,
    apiUrl: env('WEBSITE_API_URL'),
    apiKey: env('WEBSITE_API_KEY'),
    wpUsername: optionalEnv('WP_USERNAME'),
    wpAppPassword: optionalEnv('WP_APP_PASSWORD'),
    gitRepoUrl: optionalEnv('GIT_REPO_URL'),
    gitBranch: env('GIT_BRANCH', 'main'),
    gitToken: optionalEnv('GIT_TOKEN'),
    dryRun: envBool('PUBLISH_DRY_RUN', false),
    timeout: envInt('PUBLISH_TIMEOUT', 30000),
  },

  // ── Database ────────────────────────────────────────────────────
  database: {
    url: env('DATABASE_URL'),
  },

  // ── Scheduling ──────────────────────────────────────────────────
  scheduling: {
    postsPerDay: envInt('POSTS_PER_DAY', 2),
    windowStartHour: envInt('SCHEDULE_WINDOW_START', 9),
    windowEndHour: envInt('SCHEDULE_WINDOW_END', 21),
    minSpacingHours: envInt('MIN_POST_SPACING_HOURS', 4),
    skipWeekends: envBool('SKIP_WEEKENDS', false),
    timezone: env('SCHEDULE_TIMEZONE', 'America/New_York'),
    generationCron: env('GENERATION_CRON', '0 2 * * *'),
    publishCheckCron: env('PUBLISH_CHECK_CRON', '0 * * * *'),
    healthCheckPort: envInt('HEALTH_CHECK_PORT', 3000),
  },

  // ── Content ─────────────────────────────────────────────────────
  content: {
    defaultLanguage: env('DEFAULT_LANGUAGE', 'en'),
    minWords: envInt('MIN_WORD_COUNT', 1500),
    maxWords: envInt('MAX_WORD_COUNT', 2500),
    categories: ALL_CATEGORIES,
  },

  // ── Application ─────────────────────────────────────────────────
  nodeEnv: env('NODE_ENV', 'development'),
  logLevel: env('LOG_LEVEL', 'info'),
};

// ── Validation ──────────────────────────────────────────────────────

/** A single validation issue found during startup checks */
export interface ConfigIssue {
  /** 'error' = must fix before starting; 'warning' = non-fatal */
  severity: 'error' | 'warning';
  /** Which config section the issue belongs to */
  section: string;
  /** Human-readable description of the issue */
  message: string;
}

/**
 * Validates the loaded configuration.
 * Returns an array of issues — empty means everything is valid.
 *
 * Call this during application startup (index.ts) to catch
 * misconfigurations before the scheduler starts.
 */
export function validateConfig(): ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  // ── Required API Keys ─────────────────────────────────────────
  if (!config.ai.apiKey || config.ai.apiKey === 'your_key_here' || config.ai.apiKey === 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
    issues.push({
      severity: 'error',
      section: 'ai',
      message: 'ANTHROPIC_API_KEY is not set or is still the placeholder value',
    });
  } else if (!config.ai.apiKey.startsWith('sk-ant-')) {
    issues.push({
      severity: 'warning',
      section: 'ai',
      message: 'ANTHROPIC_API_KEY does not start with "sk-ant-" — verify it is correct',
    });
  }

  // ── Database URL ──────────────────────────────────────────────
  if (!config.database.url) {
    issues.push({
      severity: 'error',
      section: 'database',
      message: 'DATABASE_URL is not set',
    });
  } else if (!config.database.url.startsWith('postgresql://') && !config.database.url.startsWith('postgres://')) {
    issues.push({
      severity: 'warning',
      section: 'database',
      message: 'DATABASE_URL does not look like a PostgreSQL connection string',
    });
  }

  // ── Website / CMS ─────────────────────────────────────────────
  const validTypes: WebsiteType[] = ['wordpress', 'custom', 'static'];
  if (!validTypes.includes(config.website.type)) {
    issues.push({
      severity: 'error',
      section: 'website',
      message: `WEBSITE_TYPE must be one of: ${validTypes.join(', ')} (got "${config.website.type}")`,
    });
  }

  if (!config.website.apiUrl) {
    issues.push({
      severity: 'error',
      section: 'website',
      message: 'WEBSITE_API_URL is not set',
    });
  } else {
    try {
      new URL(config.website.apiUrl);
    } catch {
      issues.push({
        severity: 'error',
        section: 'website',
        message: `WEBSITE_API_URL is not a valid URL: "${config.website.apiUrl}"`,
      });
    }
  }

  // WordPress-specific checks
  if (config.website.type === 'wordpress') {
    if (!config.website.wpUsername) {
      issues.push({ severity: 'error', section: 'website', message: 'WP_USERNAME is required when WEBSITE_TYPE=wordpress' });
    }
    if (!config.website.wpAppPassword) {
      issues.push({ severity: 'error', section: 'website', message: 'WP_APP_PASSWORD is required when WEBSITE_TYPE=wordpress' });
    }
  }

  // Static site / GitHub checks
  if (config.website.type === 'static') {
    if (!config.website.gitRepoUrl) {
      issues.push({ severity: 'error', section: 'website', message: 'GIT_REPO_URL is required when WEBSITE_TYPE=static' });
    }
    if (!config.website.gitToken) {
      issues.push({ severity: 'error', section: 'website', message: 'GIT_TOKEN is required when WEBSITE_TYPE=static' });
    }
  }

  // ── Scheduling ────────────────────────────────────────────────
  const { windowStartHour, windowEndHour, postsPerDay, minSpacingHours } = config.scheduling;

  if (windowStartHour < 0 || windowStartHour > 23) {
    issues.push({ severity: 'error', section: 'scheduling', message: `SCHEDULE_WINDOW_START must be 0-23 (got ${windowStartHour})` });
  }
  if (windowEndHour < 0 || windowEndHour > 23) {
    issues.push({ severity: 'error', section: 'scheduling', message: `SCHEDULE_WINDOW_END must be 0-23 (got ${windowEndHour})` });
  }
  if (windowEndHour <= windowStartHour) {
    issues.push({ severity: 'error', section: 'scheduling', message: `SCHEDULE_WINDOW_END (${windowEndHour}) must be greater than SCHEDULE_WINDOW_START (${windowStartHour})` });
  }
  if (postsPerDay < 1 || postsPerDay > 10) {
    issues.push({ severity: 'error', section: 'scheduling', message: `POSTS_PER_DAY must be 1-10 (got ${postsPerDay})` });
  }
  if (minSpacingHours < 0) {
    issues.push({ severity: 'error', section: 'scheduling', message: `MIN_POST_SPACING_HOURS must be >= 0 (got ${minSpacingHours})` });
  }

  const windowHours = windowEndHour - windowStartHour;
  const requiredHours = minSpacingHours * Math.max(postsPerDay - 1, 0);
  if (requiredHours > windowHours && windowHours > 0) {
    issues.push({
      severity: 'warning',
      section: 'scheduling',
      message: `Post spacing (${requiredHours}h needed) exceeds window (${windowHours}h) — posts will be evenly distributed`,
    });
  }

  // ── Content ───────────────────────────────────────────────────
  if (config.content.minWords < 100) {
    issues.push({ severity: 'warning', section: 'content', message: `MIN_WORD_COUNT is very low (${config.content.minWords}) — posts may lack depth` });
  }
  if (config.content.maxWords < config.content.minWords) {
    issues.push({ severity: 'error', section: 'content', message: `MAX_WORD_COUNT (${config.content.maxWords}) must be >= MIN_WORD_COUNT (${config.content.minWords})` });
  }

  // ── Log Level ─────────────────────────────────────────────────
  const validLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  if (!validLogLevels.includes(config.logLevel)) {
    issues.push({
      severity: 'warning',
      section: 'application',
      message: `LOG_LEVEL "${config.logLevel}" is not a standard Winston level (${validLogLevels.join(', ')})`,
    });
  }

  return issues;
}

/**
 * Runs validateConfig() and logs all issues.
 * Throws if any issues have severity 'error'.
 *
 * Intended to be called once during application startup.
 */
export function assertConfigValid(): void {
  const issues = validateConfig();
  if (issues.length === 0) return;

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  // Log warnings (non-fatal)
  for (const w of warnings) {
    console.warn(`  [config:${w.section}] WARNING: ${w.message}`);
  }

  // Log and throw errors
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`  [config:${e.section}] ERROR: ${e.message}`);
    }
    throw new Error(
      `Configuration has ${errors.length} error(s). Fix them in .env and restart.`,
    );
  }
}

/**
 * Prints a human-readable summary of the current configuration
 * to stdout. Secrets are masked.
 */
export function printConfigSummary(): void {
  const mask = (s: string | undefined) =>
    s ? `${s.slice(0, 6)}...${'*'.repeat(8)}` : '(not set)';

  console.log('');
  console.log('  Configuration Summary');
  console.log('  ' + '─'.repeat(56));
  console.log('');
  console.log('  AI / Anthropic');
  console.log(`    API Key:    ${mask(config.ai.apiKey)}`);
  console.log(`    Model:      ${config.ai.model}`);
  console.log(`    Max Tokens: ${config.ai.maxTokens}`);
  console.log('');
  console.log('  Database');
  console.log(`    URL:        ${mask(config.database.url)}`);
  console.log('');
  console.log('  Website / CMS');
  console.log(`    Type:       ${config.website.type}`);
  console.log(`    API URL:    ${config.website.apiUrl}`);
  console.log(`    Dry Run:    ${config.website.dryRun}`);
  console.log('');
  console.log('  Scheduling');
  console.log(`    Posts/Day:  ${config.scheduling.postsPerDay}`);
  console.log(`    Window:     ${config.scheduling.windowStartHour}:00 – ${config.scheduling.windowEndHour}:00 ${config.scheduling.timezone}`);
  console.log(`    Spacing:    ${config.scheduling.minSpacingHours}h minimum`);
  console.log(`    Weekends:   ${config.scheduling.skipWeekends ? 'skip' : 'include'}`);
  console.log(`    Gen Cron:   ${config.scheduling.generationCron}`);
  console.log(`    Pub Cron:   ${config.scheduling.publishCheckCron}`);
  console.log(`    Health Port: ${config.scheduling.healthCheckPort}`);
  console.log('');
  console.log('  Content');
  console.log(`    Language:   ${config.content.defaultLanguage}`);
  console.log(`    Word Range: ${config.content.minWords} – ${config.content.maxWords}`);
  console.log(`    Categories: ${config.content.categories.join(', ')}`);
  console.log('');
  console.log('  Application');
  console.log(`    Environment: ${config.nodeEnv}`);
  console.log(`    Log Level:   ${config.logLevel}`);
  console.log('');
}

export default config;
