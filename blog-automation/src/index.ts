// ============================================
// Blog Automation System — Main Orchestrator
// ============================================
//
// Entry point for the scheduler daemon (`npm start`).
//
// Responsibilities:
//   1. Load environment variables & validate configuration
//   2. Connect to the database
//   3. Initialize and start the BlogScheduler
//      (which owns cron jobs, health/status HTTP server)
//   4. Register graceful shutdown handlers
//
// For CLI commands, see src/cli.ts.
// ============================================

import { config, assertConfigValid, printConfigSummary } from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './database/client';
import { BlogScheduler } from './schedulers/blogScheduler';
import { getTopicManager } from './services/research.service';
import { getPublishService } from './services/posting.service';

/** The singleton BlogScheduler instance */
let scheduler: BlogScheduler | null = null;

/** Whether a shutdown is already in progress */
let isShuttingDown = false;

// ── Bootstrap ───────────────────────────────────────────────────────

/**
 * Bootstraps the application:
 * 1. Logs configuration summary
 * 2. Connects to the database
 * 3. Validates external service connectivity
 * 4. Creates and starts the BlogScheduler
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  // ── Banner ──────────────────────────────────────────────────────
  logger.info('');
  logger.info('==============================================');
  logger.info('  Blog Automation System');
  logger.info('==============================================');
  logger.info('');

  // ── Validate configuration ───────────────────────────────────────
  assertConfigValid();
  printConfigSummary();

  // ── Database ────────────────────────────────────────────────────
  logger.info('Connecting to database...');
  await connectDatabase();

  // ── Service connectivity checks ─────────────────────────────────
  logger.info('Validating external services...');

  try {
    const publishService = getPublishService();
    const cmsOk = await publishService.validateConnection();
    if (cmsOk) {
      logger.info('CMS connection validated', { type: config.website.type });
    } else {
      logger.warn('CMS connection could not be validated — publishing may fail');
    }
  } catch (error) {
    logger.warn('CMS connection check failed — continuing anyway', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // ── Topic queue check ───────────────────────────────────────────
  try {
    const topicManager = getTopicManager();
    const stats = await topicManager.getQueueStats();
    logger.info('Topic queue status', {
      unused: stats.unused,
      total: stats.total,
      needsRefresh: stats.needsRefresh,
      byCategory: stats.unusedByCategory,
    });

    if (stats.needsRefresh) {
      logger.info('Topic queue is low — scheduling background refresh');
      topicManager.refreshTopicQueue().catch((err) => {
        logger.error('Background topic refresh failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  } catch (error) {
    logger.warn('Topic queue check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // ── Scheduler ───────────────────────────────────────────────────
  logger.info('Starting scheduler...');
  scheduler = new BlogScheduler();
  scheduler.start();

  const bootMs = Date.now() - startTime;
  logger.info('');
  logger.info(`Application ready (boot time: ${bootMs}ms)`);
  logger.info(`Health check:     http://localhost:${config.scheduling.healthCheckPort}/health`);
  logger.info(`Status dashboard: http://localhost:${config.scheduling.healthCheckPort}/status`);
  logger.info('');
  logger.info('Waiting for scheduled jobs... Press Ctrl+C to stop.');
}

// ── Graceful Shutdown ───────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`Duplicate ${signal} received — force exiting`);
    process.exit(1);
  }
  isShuttingDown = true;

  logger.info('');
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    // 1. Stop the scheduler (drains in-flight jobs, closes health server)
    if (scheduler) {
      await scheduler.stop();
      logger.info('Scheduler stopped');
    }

    // 2. Disconnect from the database
    await disconnectDatabase();
    logger.info('Database disconnected');

    logger.info('Shutdown complete. Goodbye.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: String(error) });
    process.exit(1);
  }
}

// ── Process Handlers ────────────────────────────────────────────────

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  // Attempt graceful shutdown on uncaught exceptions
  shutdown('uncaughtException').catch(() => process.exit(1));
});

// ── Start ───────────────────────────────────────────────────────────

main().catch((error) => {
  logger.error('Failed to start application', { error: String(error) });
  process.exit(1);
});
