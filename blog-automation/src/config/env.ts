// ============================================
// Environment Configuration (re-export)
// ============================================
//
// This module re-exports the canonical config from config.ts.
// Existing imports like `import { config } from './config/env'`
// continue to work without changes.
// ============================================

export {
  config,
  validateConfig,
  assertConfigValid,
  printConfigSummary,
} from './config';
export type { ConfigIssue } from './config';

export default config;

// Re-import for the default export
import { config } from './config';
