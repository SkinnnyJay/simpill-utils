/**
 * @file Edge Logger
 * @description Lightweight logger for Edge Runtime and browser environments
 * @runtime Edge Runtime, Browser (no Node.js dependencies)
 */

import { LOG_LEVEL, LOGGER_CONTEXT, type LogLevel } from "../shared/constants";
import { simpleFormatter } from "../shared/formatters";
import type { LogEntry, Logger, LoggerOptions, LogMetadata } from "../shared/types";

/**
 * Global flag to enable/disable mock logger for testing
 */
let isMockLoggerEnabled = false;

/**
 * Enable mock logger (suppresses all log output)
 */
export function enableEdgeMockLogger(): void {
  isMockLoggerEnabled = true;
}

/**
 * Disable mock logger (restores normal log output)
 */
export function disableEdgeMockLogger(): void {
  isMockLoggerEnabled = false;
}

/**
 * Check if mock logger is enabled
 */
export function isEdgeMockLoggerActive(): boolean {
  return isMockLoggerEnabled;
}

/**
 * Write a log line using console methods
 * Works in both Edge Runtime and browser environments
 */
function writeEdgeLogLine(
  level: LogLevel,
  name: string,
  message: string,
  metadata?: LogMetadata
): void {
  if (isMockLoggerEnabled) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    name,
    timestamp: new Date().toISOString(),
    metadata,
  };

  const line = simpleFormatter(entry);

  // Use appropriate console method based on level
  switch (level) {
    case LOG_LEVEL.ERROR:
      console.error(line);
      break;
    case LOG_LEVEL.WARN:
      console.warn(line);
      break;
    case LOG_LEVEL.DEBUG:
      console.debug(line);
      break;
    default:
      console.info(line);
      break;
  }
}

/**
 * Create a lightweight logger for Edge Runtime
 *
 * @param name - Logger name/context
 * @param options - Optional configuration (limited in edge)
 * @returns Logger instance
 */
export function createEdgeLogger(name: string, _options?: LoggerOptions): Logger {
  return {
    info: (message: string, metadata?: LogMetadata): void =>
      writeEdgeLogLine(LOG_LEVEL.INFO, name, message, metadata),
    warn: (message: string, metadata?: LogMetadata): void =>
      writeEdgeLogLine(LOG_LEVEL.WARN, name, message, metadata),
    debug: (message: string, metadata?: LogMetadata): void =>
      writeEdgeLogLine(LOG_LEVEL.DEBUG, name, message, metadata),
    error: (message: string, metadata?: LogMetadata): void =>
      writeEdgeLogLine(LOG_LEVEL.ERROR, name, message, metadata),
  };
}

/**
 * Log a single info message
 */
export function edgeLogInfo(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.INFO, name, message, metadata);
}

/**
 * Log a single warning message
 */
export function edgeLogWarn(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.WARN, name, message, metadata);
}

/**
 * Log a single debug message
 */
export function edgeLogDebug(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.DEBUG, name, message, metadata);
}

/**
 * Log a single error message
 */
export function edgeLogError(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.ERROR, name, message, metadata);
}

/**
 * Pre-configured edge logger instance
 */
export const EdgeLogInstance: Logger = createEdgeLogger(LOGGER_CONTEXT.LOG_INSTANCE);

/**
 * Default edge logger instance
 */
export const EdgeLogger: Logger = createEdgeLogger(LOGGER_CONTEXT.DEFAULT);
