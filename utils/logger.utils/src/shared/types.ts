/**
 * @file Logger Types
 * @description Type definitions for the logger package
 */

import { LOGGER_DEFAULTS, type LogLevel } from "./constants";

/**
 * Metadata that can be attached to log entries
 */
export type LogMetadata = Readonly<Record<string, unknown>>;

/**
 * Structured error information extracted from Error objects
 * Provides consistent error serialization across all log entries
 */
export interface ErrorInfo {
  /** Error class name (e.g., "TypeError", "ValidationError") */
  name: string;
  /** Error message */
  message: string;
  /** Stack trace (if available) */
  stack?: string;
  /** Error code (e.g., "ENOENT", "ERR_INVALID_ARG") */
  code?: string;
  /** Cause chain (if Error.cause is set) */
  cause?: ErrorInfo | unknown;
}

/**
 * Extract structured error information from an Error object
 * Handles nested cause chains and non-Error values
 *
 * @param err - The error to extract info from
 * @param maxDepth - Maximum depth for cause chain (default: 3)
 * @returns Structured ErrorInfo or undefined if not an Error
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (err) {
 *   logger.error("Fetch failed", { error: extractErrorInfo(err) });
 * }
 * ```
 */
export function extractErrorInfo(
  err: unknown,
  maxDepth: number = LOGGER_DEFAULTS.MAX_ERROR_CAUSE_DEPTH
): ErrorInfo | undefined {
  if (!(err instanceof Error)) {
    return undefined;
  }

  const info: ErrorInfo = {
    name: err.name,
    message: err.message,
  };

  if (err.stack) {
    info.stack = err.stack;
  }

  // Extract code from Node.js system errors
  const nodeErr = err as NodeJS.ErrnoException;
  if (nodeErr.code) {
    info.code = nodeErr.code;
  }

  // Extract cause chain (ES2022 Error.cause)
  if (err.cause !== undefined && maxDepth > 0) {
    if (err.cause instanceof Error) {
      info.cause = extractErrorInfo(err.cause, maxDepth - 1);
    } else {
      info.cause = err.cause;
    }
  }

  return info;
}

/**
 * Check if a value looks like an Error object
 * Useful for detecting errors in metadata
 */
export function isErrorLike(value: unknown): value is Error {
  return (
    value instanceof Error ||
    (typeof value === "object" &&
      value !== null &&
      "message" in value &&
      "name" in value &&
      typeof (value as Error).message === "string" &&
      typeof (value as Error).name === "string")
  );
}

/**
 * Auto-extract errors from metadata
 * Scans metadata for Error objects and converts them to ErrorInfo
 *
 * @param metadata - Log metadata that may contain Error objects
 * @returns Metadata with Error objects converted to ErrorInfo
 */
export function normalizeErrorsInMetadata(
  metadata: LogMetadata | undefined
): LogMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  let hasChanges = false;
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Only extract from actual Error instances
    if (value instanceof Error) {
      hasChanges = true;
      normalized[key] = extractErrorInfo(value);
    } else {
      normalized[key] = value;
    }
  }

  // Return original if no errors found (avoid unnecessary object creation)
  return hasChanges ? normalized : metadata;
}

/**
 * Core logger interface with standard log methods
 */
export interface Logger {
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}

/**
 * Alias for Logger interface
 */
export type Log = Logger;

/**
 * Configuration options for creating a logger
 */
export interface LoggerOptions {
  /** Logger name/context for identification */
  name?: string;
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Whether to include timestamps */
  includeTimestamp?: boolean;
  /** Custom metadata to include in all logs */
  defaultMetadata?: LogMetadata;
}

/**
 * Structured log entry format
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  name: string;
  timestamp?: string;
  metadata?: LogMetadata;
}

/**
 * Log writer function signature
 */
export type LogWriter = (entry: LogEntry) => void;

/**
 * Log formatter function signature
 */
export type LogFormatter = (entry: LogEntry) => string;

/**
 * Log level priority map for filtering
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

/**
 * Check if a log level should be output based on minimum level
 */
export function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}
