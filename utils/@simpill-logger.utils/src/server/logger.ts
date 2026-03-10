/**
 * @file Server Logger
 * @description Full-featured logger for Node.js runtime
 * @runtime Node.js only
 */

import { LOGGER_CONTEXT, type LoggableLevel, METADATA_KEYS } from "../shared/constants";
import { LoggerFactory } from "../shared/factory";
import type { Logger, LoggerOptions, LogMetadata } from "../shared/types";

/**
 * Enable mock logger (suppresses all log output)
 * Useful for testing to prevent log noise
 */
export function enableMockLogger(): void {
  LoggerFactory.enableMock();
}

/**
 * Disable mock logger (restores normal log output)
 */
export function disableMockLogger(): void {
  LoggerFactory.disableMock();
}

/**
 * Check if mock logger is enabled
 */
export function isMockLoggerActive(): boolean {
  return LoggerFactory.isMockEnabled();
}

/**
 * Create a logger instance for a specific class or module
 * Uses the configured adapter (defaults to SimpleLoggerAdapter)
 *
 * @param className - Name to identify the logger source
 * @param options - Optional configuration
 * @returns Logger instance with info, warn, debug, error methods
 */
export function createClassLogger(className: string, options?: LoggerOptions): Logger {
  return LoggerFactory.getLogger(className, options?.defaultMetadata);
}

/**
 * Log tabular data with optional console.table output
 *
 * @param logger - Logger instance to use
 * @param level - Log level (info, warn, debug)
 * @param label - Label for the table
 * @param rows - Array of data to display
 */
export function logTable(
  logger: Logger,
  level: LoggableLevel,
  label: string,
  rows: readonly unknown[]
): void {
  logger[level](label, { [METADATA_KEYS.TABLE]: rows });

  if (
    !LoggerFactory.isMockEnabled() &&
    typeof console !== "undefined" &&
    typeof console.table === "function"
  ) {
    console.table(rows);
  }
}

/**
 * Log an executor event (convenience wrapper)
 */
export function logExecutorEvent(logger: Logger, message: string, metadata?: LogMetadata): void {
  logger.info(message, metadata);
}

/**
 * Log an LLM event (convenience wrapper)
 */
export function logLLMEvent(logger: Logger, message: string, metadata?: LogMetadata): void {
  logger.info(message, metadata);
}

/**
 * Singleton logger manager for application-wide logging
 */
export class LoggerSingleton {
  private static instance: LoggerSingleton | null = null;
  private readonly baseLogger: Logger;

  private constructor() {
    this.baseLogger = createClassLogger(LOGGER_CONTEXT.DEFAULT);
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LoggerSingleton {
    if (LoggerSingleton.instance === null) {
      LoggerSingleton.instance = new LoggerSingleton();
    }
    return LoggerSingleton.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    LoggerSingleton.instance = null;
  }

  /**
   * Get a logger for a specific context/class
   */
  public getLogger(context: string, options?: LoggerOptions): Logger {
    return createClassLogger(context, options);
  }

  /**
   * Log an info message
   */
  public info(message: string, metadata?: LogMetadata): void {
    this.baseLogger.info(message, metadata);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, metadata?: LogMetadata): void {
    this.baseLogger.warn(message, metadata);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, metadata?: LogMetadata): void {
    this.baseLogger.debug(message, metadata);
  }

  /**
   * Log an error message
   */
  public error(message: string, metadata?: LogMetadata): void {
    this.baseLogger.error(message, metadata);
  }
}

/**
 * Alias for LoggerSingleton
 */
export const LoggerInstance = LoggerSingleton;

/**
 * Pre-configured logger instance
 */
export const LogInstance: Logger = createClassLogger(LOGGER_CONTEXT.LOG_INSTANCE);
