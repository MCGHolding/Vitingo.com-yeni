/**
 * Logger utility for conditional logging based on environment
 * 
 * Usage:
 *   import { logger } from './utils/logger';
 *   logger.log('Debug message');
 *   logger.error('Error message');
 */

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEBUG = process.env.REACT_APP_DEBUG === 'true' || IS_DEVELOPMENT;

export const logger = {
  log: (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (DEBUG) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    if (DEBUG) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  debug: (...args) => {
    if (DEBUG) {
      console.debug(...args);
    }
  },
  
  table: (...args) => {
    if (DEBUG) {
      console.table(...args);
    }
  }
};

// For backward compatibility
export default logger;
