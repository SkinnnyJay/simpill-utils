/**
 * @file Edge Logger
 * @description Lightweight logger for Edge Runtime and browser environments
 * @runtime Edge Runtime, Browser (no Node.js dependencies)
 */

import { LOG_LEVEL, LOGGER_CONTEXT, type LogLevel } from "../shared/constants";
import { simpleFormatter } from "../shared/formatters";
import { createDefaultRedactor, type Redactor } from "../shared/redact";
import type { LogEntry, Logger, LoggerOptions, LogMetadata } from "../shared/types";
import { LOG_LEVEL_PRIORITY } from "../shared/types";

/**
 * Global flag to enable/disable mock logger for testing
 */
let isMockLoggerEnabled = false;

/** Default redactor shared by one-shot edgeLog* helpers. */
const defaultEdgeRedactor: Redactor = createDefaultRedactor();

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
  metadata: LogMetadata | undefined,
  redactor: Redactor
): void {
  if (isMockLoggerEnabled) {
    return;
  }

  const safeMetadata = metadata ? redactor(metadata) : undefined;

  const entry: LogEntry = {
    level,
    message,
    name,
    timestamp: new Date().toISOString(),
    metadata: safeMetadata,
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
 * @param options - Optional configuration. `options.minLevel` IS honored
 *   (the frozen version accepted LoggerOptions but silently ignored it —
 *   `createEdgeLogger("X", { minLevel: "ERROR" })` still logged everything).
 *   Sensitive metadata keys are always redacted; `options.redactPaths` adds more.
 * @returns Logger instance
 */
export function createEdgeLogger(name: string, options?: LoggerOptions): Logger {
  const minLevel = options?.minLevel ?? LOG_LEVEL.DEBUG;
  const minPriority = LOG_LEVEL_PRIORITY[minLevel];
  const redactor = createDefaultRedactor(options?.redactPaths);
  const isEnabled = (level: LogLevel): boolean => LOG_LEVEL_PRIORITY[level] >= minPriority;
  const write = (level: LogLevel, message: string, metadata?: LogMetadata): void => {
    if (!isEnabled(level)) {
      return;
    }
    writeEdgeLogLine(level, name, message, metadata, redactor);
  };
  return {
    info: (message: string, metadata?: LogMetadata): void =>
      write(LOG_LEVEL.INFO, message, metadata),
    warn: (message: string, metadata?: LogMetadata): void =>
      write(LOG_LEVEL.WARN, message, metadata),
    debug: (message: string, metadata?: LogMetadata): void =>
      write(LOG_LEVEL.DEBUG, message, metadata),
    error: (message: string, metadata?: LogMetadata): void =>
      write(LOG_LEVEL.ERROR, message, metadata),
    child(nameOrMetadata: string | LogMetadata, metadata?: LogMetadata): Logger {
      if (typeof nameOrMetadata === "string") {
        const childName = `${name}.${nameOrMetadata}`;
        const childLogger = createEdgeLogger(childName, options);
        if (!metadata) {
          return childLogger;
        }
        const wrap =
          (fn: (message: string, meta?: LogMetadata) => void) =>
          (message: string, meta?: LogMetadata): void =>
            fn(message, { ...metadata, ...meta });
        return {
          ...childLogger,
          info: wrap(childLogger.info),
          warn: wrap(childLogger.warn),
          debug: wrap(childLogger.debug),
          error: wrap(childLogger.error),
        };
      }

      const childMeta = nameOrMetadata;
      const childLogger = createEdgeLogger(name, options);
      const wrap =
        (fn: (message: string, meta?: LogMetadata) => void) =>
        (message: string, meta?: LogMetadata): void =>
          fn(message, { ...childMeta, ...meta });
      return {
        ...childLogger,
        info: wrap(childLogger.info),
        warn: wrap(childLogger.warn),
        debug: wrap(childLogger.debug),
        error: wrap(childLogger.error),
      };
    },
    isLevelEnabled(level: LogLevel): boolean {
      return !isMockLoggerEnabled && isEnabled(level);
    },
  };
}

/**
 * Log a single info message
 */
export function edgeLogInfo(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.INFO, name, message, metadata, defaultEdgeRedactor);
}

/**
 * Log a single warning message
 */
export function edgeLogWarn(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.WARN, name, message, metadata, defaultEdgeRedactor);
}

/**
 * Log a single debug message
 */
export function edgeLogDebug(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.DEBUG, name, message, metadata, defaultEdgeRedactor);
}

/**
 * Log a single error message
 */
export function edgeLogError(name: string, message: string, metadata?: LogMetadata): void {
  writeEdgeLogLine(LOG_LEVEL.ERROR, name, message, metadata, defaultEdgeRedactor);
}

/**
 * Pre-configured edge logger instance
 */
export const EdgeLogInstance: Logger = createEdgeLogger(LOGGER_CONTEXT.LOG_INSTANCE);

/**
 * Default edge logger instance
 */
export const EdgeLogger: Logger = createEdgeLogger(LOGGER_CONTEXT.DEFAULT);
