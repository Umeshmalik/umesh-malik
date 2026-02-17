// ============================================
// Winston Logger Configuration
// ============================================

import winston from 'winston';
import path from 'path';
import { config } from './env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/** Directory for log files */
const LOG_DIR = path.resolve(__dirname, '../../logs');

/** Custom log format for console output */
const consoleFormat = printf(({ level, message, timestamp: ts, service, ...meta }) => {
  const svc = service ? `[${service}]` : '';
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level} ${svc} ${message}${metaStr}`;
});

/**
 * Application logger with file and console transports.
 *
 * - Console: colorized, human-readable format
 * - combined.log: all levels, JSON format
 * - error.log: error level only, JSON format
 */
export const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: { service: 'blog-automation' },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
  ),
  transports: [
    // Console transport — colorized, readable
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat,
      ),
    }),

    // Combined log file — all levels, JSON
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: json(),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),

    // Error log file — errors only, JSON
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: json(),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Creates a child logger with a specific service name.
 */
export function createServiceLogger(serviceName: string): winston.Logger {
  return logger.child({ service: serviceName });
}

export default logger;
