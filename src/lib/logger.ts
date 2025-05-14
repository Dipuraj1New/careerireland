/**
 * Logging utility
 * Provides structured logging with different log levels
 */
import config from './config';

// Log levels
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  [key: string]: any;
}

/**
 * Format log entry based on configuration
 * @param entry Log entry
 * @returns Formatted log entry
 */
const formatLogEntry = (entry: LogEntry): string => {
  if (config.log.format === 'json') {
    return JSON.stringify(entry);
  }
  
  // Pretty format
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${context}`;
};

/**
 * Check if log level should be logged
 * @param level Log level to check
 * @returns True if level should be logged
 */
const shouldLog = (level: LogLevel): boolean => {
  const levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };
  
  return levels[level] <= levels[config.log.level];
};

/**
 * Create log entry
 * @param level Log level
 * @param message Log message
 * @param context Additional context
 * @returns Log entry
 */
const createLogEntry = (level: LogLevel, message: string, context?: Record<string, any>): LogEntry => {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    environment: config.env,
  };
};

/**
 * Log error message
 * @param message Error message
 * @param context Additional context
 */
export const error = (message: string, context?: Record<string, any>): void => {
  if (shouldLog('error')) {
    const entry = createLogEntry('error', message, context);
    console.error(formatLogEntry(entry));
  }
};

/**
 * Log warning message
 * @param message Warning message
 * @param context Additional context
 */
export const warn = (message: string, context?: Record<string, any>): void => {
  if (shouldLog('warn')) {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLogEntry(entry));
  }
};

/**
 * Log info message
 * @param message Info message
 * @param context Additional context
 */
export const info = (message: string, context?: Record<string, any>): void => {
  if (shouldLog('info')) {
    const entry = createLogEntry('info', message, context);
    console.info(formatLogEntry(entry));
  }
};

/**
 * Log debug message
 * @param message Debug message
 * @param context Additional context
 */
export const debug = (message: string, context?: Record<string, any>): void => {
  if (shouldLog('debug')) {
    const entry = createLogEntry('debug', message, context);
    console.debug(formatLogEntry(entry));
  }
};

export default {
  error,
  warn,
  info,
  debug,
};
