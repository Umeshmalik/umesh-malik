// ============================================
// Jest Configuration
// ============================================

import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest to transpile TypeScript
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directories for tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.ts',
  ],

  // Module path aliases (mirrors tsconfig paths)
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@schedulers/(.*)$': '<rootDir>/src/schedulers/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/cli.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // ts-jest configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },

  // Timeout for individual tests (15s — some tests mock timers)
  testTimeout: 15000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output for CI
  verbose: true,
};

export default config;
