/**
 * @file Logger Adapter Interface
 * @description Plugin architecture for swappable logger implementations
 */

import type { LogLevel } from "./constants";
import type { FormatterAdapter } from "./formatters/formatter.adapter";
import type { RedactOptions } from "./redact";
import type { LogEntry, LogMetadata } from "./types";

/**
 * Configuration for initializing a logger adapter
 */
export interface LoggerAdapterConfig {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Whether to include timestamps in output */
  includeTimestamp?: boolean;
  /** Pretty print output (human-readable vs JSON) */
  prettyPrint?: boolean;
  /** Custom formatter adapter for controlling output format */
  formatter?: FormatterAdapter;
  /**
   * Redact sensitive metadata before it reaches any adapter.
   * Either an array of paths ("password", "user.token", "users[*].password",
   * "config.*") or a full RedactOptions with a custom censor.
   * Compiled once at configuration time; the caller's metadata is never mutated.
   */
  redact?: RedactOptions | readonly string[];
  /** Additional adapter-specific options */
  options?: Record<string, unknown>;
}

/**
 * Logger adapter interface - implement this to create custom logger backends
 *
 * @example
 * ```typescript
 * // Using Pino
 * class PinoAdapter implements LoggerAdapter {
 *   private pino: pino.Logger;
 *
 *   initialize(config: LoggerAdapterConfig): void {
 *     this.pino = pino({ level: config.minLevel?.toLowerCase() });
 *   }
 *
 *   log(entry: LogEntry): void {
 *     const method = entry.level.toLowerCase() as keyof pino.Logger;
 *     this.pino[method](entry.metadata, entry.message);
 *   }
 *
 *   child(name: string): LoggerAdapter {
 *     const childAdapter = new PinoAdapter();
 *     childAdapter.pino = this.pino.child({ name });
 *     return childAdapter;
 *   }
 * }
 *
 * // Register and use
 * LoggerFactory.setAdapter(new PinoAdapter());
 * const logger = LoggerFactory.getLogger("MyService");
 * ```
 */
export interface LoggerAdapter {
  /**
   * Initialize the adapter with configuration
   * Called once when the adapter is registered
   */
  initialize(config: LoggerAdapterConfig): void;

  /**
   * Write a log entry
   * This is the core method that handles actual log output
   */
  log(entry: LogEntry): void;

  /**
   * Create a child logger with inherited context
   * Used for creating named loggers (e.g., per-class loggers)
   *
   * @param name - Name/context for the child logger
   * @param defaultMetadata - Optional metadata to include in all logs from this child
   */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter;

  /**
   * Fast level gate (optional). When implemented, the factory calls this
   * BEFORE building the log entry — a disabled level then costs a single
   * method call instead of context lookup + metadata merge + Date + entry
   * allocation. Adapters that don't implement it keep the previous behavior
   * exactly (every entry is built and passed to log()).
   */
  isLevelEnabled?(level: LogLevel): boolean;

  /**
   * Flush any buffered logs (optional)
   * Some adapters buffer logs for performance
   */
  flush?(): Promise<void>;

  /**
   * Clean up resources (optional)
   * Called when switching adapters or shutting down
   */
  destroy?(): Promise<void>;
}

/**
 * Type guard to check if an object implements LoggerAdapter
 */
export function isLoggerAdapter(obj: unknown): obj is LoggerAdapter {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const adapter = obj as Record<string, unknown>;
  return (
    typeof adapter.initialize === "function" &&
    typeof adapter.log === "function" &&
    typeof adapter.child === "function"
  );
}
