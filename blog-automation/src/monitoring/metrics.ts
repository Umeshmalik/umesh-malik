// ============================================
// Monitoring — Performance Metrics Collector
// ============================================
//
// Lightweight in-process metrics collector for tracking:
//   - Operation durations (research, generation, publishing)
//   - Success/failure counts
//   - API call counts and latencies
//   - Memory and uptime stats
//
// Metrics are exposed via the /status endpoint and can be
// forwarded to external monitoring services.
//
// ============================================

import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('metrics');

// ── Types ───────────────────────────────────────────────────────────

export interface MetricEntry {
  /** Name of the operation */
  name: string;
  /** When the metric was recorded */
  timestamp: Date;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Optional metadata */
  metadata?: Record<string, string | number>;
}

export interface MetricsSummary {
  /** Total operations tracked */
  totalOperations: number;
  /** Successful operations */
  successCount: number;
  /** Failed operations */
  failureCount: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average duration in ms */
  avgDurationMs: number;
  /** P95 duration in ms */
  p95DurationMs: number;
  /** Max duration in ms */
  maxDurationMs: number;
  /** Time window start */
  windowStart: Date;
  /** Time window end */
  windowEnd: Date;
}

export interface SystemMetrics {
  /** Process uptime in seconds */
  uptimeSeconds: number;
  /** Heap memory used in MB */
  heapUsedMb: number;
  /** Heap total allocated in MB */
  heapTotalMb: number;
  /** RSS (resident set size) in MB */
  rssMb: number;
  /** CPU user time in ms (since last check) */
  cpuUserMs: number;
  /** CPU system time in ms (since last check) */
  cpuSystemMs: number;
}

// ── Metrics Collector ───────────────────────────────────────────────

export class MetricsCollector {
  /** Ring buffer of recent metrics (capped at maxEntries) */
  private entries: MetricEntry[] = [];
  private readonly maxEntries: number;
  private readonly startedAt: Date;
  private lastCpuUsage: NodeJS.CpuUsage;

  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
    this.startedAt = new Date();
    this.lastCpuUsage = process.cpuUsage();

    logger.info('MetricsCollector initialized', { maxEntries });
  }

  // ── Recording ───────────────────────────────────────────────────

  /**
   * Records a completed operation.
   */
  record(entry: MetricEntry): void {
    this.entries.push(entry);

    // Evict oldest entries when buffer is full
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  /**
   * Creates a timer that automatically records when stopped.
   *
   * Usage:
   *   const timer = metrics.startTimer('research');
   *   try {
   *     await doWork();
   *     timer.stop(true);
   *   } catch {
   *     timer.stop(false);
   *   }
   */
  startTimer(name: string, metadata?: Record<string, string | number>): MetricTimer {
    const start = Date.now();
    return {
      stop: (success: boolean) => {
        this.record({
          name,
          timestamp: new Date(),
          durationMs: Date.now() - start,
          success,
          metadata,
        });
      },
    };
  }

  // ── Querying ────────────────────────────────────────────────────

  /**
   * Returns a summary of metrics for a specific operation
   * within the given time window (default: last hour).
   */
  getSummary(name: string, windowMinutes: number = 60): MetricsSummary {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const windowEnd = new Date();

    const filtered = this.entries.filter(
      (e) => e.name === name && e.timestamp >= windowStart,
    );

    if (filtered.length === 0) {
      return {
        totalOperations: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDurationMs: 0,
        p95DurationMs: 0,
        maxDurationMs: 0,
        windowStart,
        windowEnd,
      };
    }

    const successes = filtered.filter((e) => e.success).length;
    const durations = filtered.map((e) => e.durationMs).sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      totalOperations: filtered.length,
      successCount: successes,
      failureCount: filtered.length - successes,
      successRate: successes / filtered.length,
      avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p95DurationMs: durations[p95Index] || 0,
      maxDurationMs: durations[durations.length - 1] || 0,
      windowStart,
      windowEnd,
    };
  }

  /**
   * Returns summaries for all tracked operation types.
   */
  getAllSummaries(windowMinutes: number = 60): Record<string, MetricsSummary> {
    const names = [...new Set(this.entries.map((e) => e.name))];
    const summaries: Record<string, MetricsSummary> = {};

    for (const name of names) {
      summaries[name] = this.getSummary(name, windowMinutes);
    }

    return summaries;
  }

  /**
   * Returns system-level metrics (memory, uptime, CPU).
   */
  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rssMb: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      cpuUserMs: Math.round(cpuUsage.user / 1000),
      cpuSystemMs: Math.round(cpuUsage.system / 1000),
    };
  }

  /**
   * Returns the raw count of entries currently stored.
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Clears all stored metrics (useful for testing).
   */
  reset(): void {
    this.entries = [];
  }
}

// ── Timer Interface ─────────────────────────────────────────────────

export interface MetricTimer {
  /** Stop the timer and record the metric */
  stop(success: boolean): void;
}

// ── Singleton ───────────────────────────────────────────────────────

let _collector: MetricsCollector | null = null;

/**
 * Returns the shared MetricsCollector instance.
 */
export function getMetrics(): MetricsCollector {
  if (!_collector) {
    _collector = new MetricsCollector();
  }
  return _collector;
}

export default MetricsCollector;
