// ============================================
// Prisma Database Client
// ============================================

import { PrismaClient } from '@prisma/client';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('database');

/**
 * Singleton Prisma client instance.
 * Reuses the client across the application to avoid exhausting DB connections.
 */
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log database events
prisma.$on('error', (e) => {
  logger.error('Database error', { message: e.message, target: e.target });
});

prisma.$on('warn', (e) => {
  logger.warn('Database warning', { message: e.message, target: e.target });
});

/**
 * Connects to the database and verifies the connection.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error: String(error) });
    throw error;
  }
}

/**
 * Gracefully disconnects from the database.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export { prisma };
export default prisma;
