// ============================================
// Monitoring — Notification Service
// ============================================
//
// Sends alerts when the blog automation system encounters
// errors, publishes posts, or hits operational thresholds.
//
// Supported channels:
//   - Slack webhook
//   - Email (via generic SMTP or service webhook)
//   - Console (fallback for development)
//
// ============================================

import axios from 'axios';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('notifier');

// ── Types ───────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertPayload {
  /** Alert severity level */
  severity: AlertSeverity;
  /** Short title (shown in notification header) */
  title: string;
  /** Detailed message body */
  message: string;
  /** Optional metadata fields */
  metadata?: Record<string, string | number | boolean>;
  /** Timestamp (defaults to now) */
  timestamp?: Date;
}

export interface NotifierConfig {
  /** Slack webhook URL (optional) */
  slackWebhookUrl?: string;
  /** Email webhook URL — POST with JSON body (optional) */
  emailWebhookUrl?: string;
  /** Email recipient address (for email webhook) */
  emailRecipient?: string;
  /** Minimum severity to actually send (default: 'warning') */
  minSeverity: AlertSeverity;
  /** Whether to log alerts to console (always true in dev) */
  consoleOutput: boolean;
}

// ── Severity Ordering ───────────────────────────────────────────────

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

// ── Notifier Class ──────────────────────────────────────────────────

export class Notifier {
  private readonly cfg: NotifierConfig;

  constructor(overrides?: Partial<NotifierConfig>) {
    this.cfg = {
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      emailWebhookUrl: process.env.EMAIL_WEBHOOK_URL,
      emailRecipient: process.env.ALERT_EMAIL_RECIPIENT,
      minSeverity: (process.env.ALERT_MIN_SEVERITY as AlertSeverity) || 'warning',
      consoleOutput: process.env.NODE_ENV !== 'production',
      ...overrides,
    };

    logger.info('Notifier initialized', {
      slackConfigured: !!this.cfg.slackWebhookUrl,
      emailConfigured: !!this.cfg.emailWebhookUrl,
      minSeverity: this.cfg.minSeverity,
    });
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Sends an alert through all configured channels.
   * Alerts below `minSeverity` are silently dropped.
   */
  async send(alert: AlertPayload): Promise<void> {
    const payload = { ...alert, timestamp: alert.timestamp ?? new Date() };

    // Check severity threshold
    if (SEVERITY_ORDER[payload.severity] < SEVERITY_ORDER[this.cfg.minSeverity]) {
      return;
    }

    // Console output (always in dev, configurable in prod)
    if (this.cfg.consoleOutput) {
      this.logToConsole(payload);
    }

    // Send to all configured channels in parallel
    const promises: Promise<void>[] = [];

    if (this.cfg.slackWebhookUrl) {
      promises.push(this.sendSlack(payload));
    }

    if (this.cfg.emailWebhookUrl && this.cfg.emailRecipient) {
      promises.push(this.sendEmail(payload));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Convenience: send an error alert.
   */
  async error(title: string, message: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    return this.send({ severity: 'error', title, message, metadata });
  }

  /**
   * Convenience: send a warning alert.
   */
  async warn(title: string, message: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    return this.send({ severity: 'warning', title, message, metadata });
  }

  /**
   * Convenience: send an info alert.
   */
  async info(title: string, message: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    return this.send({ severity: 'info', title, message, metadata });
  }

  /**
   * Convenience: send a critical alert.
   */
  async critical(title: string, message: string, metadata?: Record<string, string | number | boolean>): Promise<void> {
    return this.send({ severity: 'critical', title, message, metadata });
  }

  // ── Channel Implementations ─────────────────────────────────────

  /**
   * Sends alert to Slack via incoming webhook.
   */
  private async sendSlack(alert: AlertPayload): Promise<void> {
    try {
      const emoji = this.severityEmoji(alert.severity);
      const color = this.severityColor(alert.severity);

      const metaFields = alert.metadata
        ? Object.entries(alert.metadata).map(([k, v]) => ({
            title: k,
            value: String(v),
            short: true,
          }))
        : [];

      const payload = {
        text: `${emoji} *${alert.title}*`,
        attachments: [
          {
            color,
            text: alert.message,
            fields: [
              { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
              { title: 'Time', value: alert.timestamp!.toISOString(), short: true },
              ...metaFields,
            ],
            footer: 'Blog Automation System',
            ts: Math.floor(alert.timestamp!.getTime() / 1000),
          },
        ],
      };

      await axios.post(this.cfg.slackWebhookUrl!, payload, { timeout: 10000 });
      logger.debug('Slack notification sent', { title: alert.title });
    } catch (error) {
      logger.error('Failed to send Slack notification', {
        error: error instanceof Error ? error.message : String(error),
        title: alert.title,
      });
    }
  }

  /**
   * Sends alert via email webhook (generic POST endpoint).
   * Compatible with services like SendGrid, Mailgun, or custom email APIs.
   */
  private async sendEmail(alert: AlertPayload): Promise<void> {
    try {
      const payload = {
        to: this.cfg.emailRecipient,
        subject: `[Blog Automation] [${alert.severity.toUpperCase()}] ${alert.title}`,
        body: [
          `Severity: ${alert.severity.toUpperCase()}`,
          `Time: ${alert.timestamp!.toISOString()}`,
          '',
          alert.message,
          '',
          alert.metadata
            ? Object.entries(alert.metadata).map(([k, v]) => `${k}: ${v}`).join('\n')
            : '',
        ].join('\n'),
      };

      await axios.post(this.cfg.emailWebhookUrl!, payload, { timeout: 10000 });
      logger.debug('Email notification sent', { title: alert.title, to: this.cfg.emailRecipient });
    } catch (error) {
      logger.error('Failed to send email notification', {
        error: error instanceof Error ? error.message : String(error),
        title: alert.title,
      });
    }
  }

  /**
   * Logs the alert to console with formatting.
   */
  private logToConsole(alert: AlertPayload): void {
    const emoji = this.severityEmoji(alert.severity);
    const ts = alert.timestamp!.toISOString();
    const meta = alert.metadata
      ? ` | ${Object.entries(alert.metadata).map(([k, v]) => `${k}=${v}`).join(', ')}`
      : '';

    logger.info(`${emoji} [ALERT] ${alert.title}: ${alert.message}${meta}`, {
      severity: alert.severity,
      timestamp: ts,
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private severityEmoji(severity: AlertSeverity): string {
    const map: Record<AlertSeverity, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🔴',
      critical: '🚨',
    };
    return map[severity];
  }

  private severityColor(severity: AlertSeverity): string {
    const map: Record<AlertSeverity, string> = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      critical: '#B71C1C',
    };
    return map[severity];
  }
}

// ── Singleton ───────────────────────────────────────────────────────

let _notifier: Notifier | null = null;

/**
 * Returns the shared Notifier instance (creates it on first call).
 */
export function getNotifier(): Notifier {
  if (!_notifier) {
    _notifier = new Notifier();
  }
  return _notifier;
}

export default Notifier;
