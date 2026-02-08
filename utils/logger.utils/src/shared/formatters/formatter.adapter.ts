/**
 * @file Formatter Adapter
 * @description Plugin architecture for custom log formatters with full context access
 */

import { ENV_KEYS, LOG_LEVEL, type LogLevel } from "../constants";
import type { LogEntry, LogMetadata } from "../types";

/**
 * Extended context available to formatters
 * Provides rich information about the log source and environment
 */
export interface FormatterContext {
  /** The logger name/class that created this log */
  loggerName: string;
  /** The log level */
  level: LogLevel;
  /** ISO timestamp when the log was created */
  timestamp: string;
  /** The log message */
  message: string;
  /** Optional metadata attached to the log */
  metadata?: LogMetadata;
  /** Process ID (Node.js only) */
  pid?: number;
  /** Hostname (if available) */
  hostname?: string;
}

/**
 * Result of formatting a log entry
 * Can be a string or structured object for adapters that handle their own output
 */
export type FormattedOutput = string | Record<string, unknown>;

/**
 * Formatter adapter interface - implement this to create custom formatters
 *
 * @example
 * ```typescript
 * class ColoredFormatter implements FormatterAdapter {
 *   formatInfo(ctx: FormatterContext): string {
 *     return `\x1b[34m[INFO]\x1b[0m ${ctx.loggerName}: ${ctx.message}`;
 *   }
 *   formatWarn(ctx: FormatterContext): string {
 *     return `\x1b[33m[WARN]\x1b[0m ${ctx.loggerName}: ${ctx.message}`;
 *   }
 *   // ... etc
 * }
 * ```
 */
export interface FormatterAdapter {
  /**
   * Format an INFO level log
   */
  formatInfo(context: FormatterContext): FormattedOutput;

  /**
   * Format a WARN level log
   */
  formatWarn(context: FormatterContext): FormattedOutput;

  /**
   * Format a DEBUG level log
   */
  formatDebug(context: FormatterContext): FormattedOutput;

  /**
   * Format an ERROR level log
   */
  formatError(context: FormatterContext): FormattedOutput;
}

/**
 * Type guard to check if an object implements FormatterAdapter
 */
export function isFormatterAdapter(obj: unknown): obj is FormatterAdapter {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const adapter = obj as Record<string, unknown>;
  return (
    typeof adapter.formatInfo === "function" &&
    typeof adapter.formatWarn === "function" &&
    typeof adapter.formatDebug === "function" &&
    typeof adapter.formatError === "function"
  );
}

/**
 * Convert a LogEntry to FormatterContext
 */
export function createFormatterContext(entry: LogEntry): FormatterContext {
  return {
    loggerName: entry.name,
    level: entry.level,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    message: entry.message,
    metadata: entry.metadata,
    pid: typeof process !== "undefined" ? process.pid : undefined,
    hostname: getHostname(),
  };
}

/**
 * Get hostname safely (works in Node.js, returns undefined in browser)
 */
function getHostname(): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env?.[ENV_KEYS.HOSTNAME]) {
      return process.env[ENV_KEYS.HOSTNAME];
    }
    // In Node.js, we could use os.hostname() but that requires importing 'os'
    // For simplicity, we'll just use the env var or undefined
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Format a log entry using a FormatterAdapter
 */
export function formatWithAdapter(adapter: FormatterAdapter, entry: LogEntry): FormattedOutput {
  const context = createFormatterContext(entry);

  switch (entry.level) {
    case LOG_LEVEL.INFO:
      return adapter.formatInfo(context);
    case LOG_LEVEL.WARN:
      return adapter.formatWarn(context);
    case LOG_LEVEL.DEBUG:
      return adapter.formatDebug(context);
    case LOG_LEVEL.ERROR:
      return adapter.formatError(context);
    default:
      return adapter.formatInfo(context);
  }
}

/**
 * Convert FormattedOutput to string for writing
 */
export function outputToString(output: FormattedOutput): string {
  if (typeof output === "string") {
    return output;
  }
  return JSON.stringify(output);
}
