/**
 * @file Simple Logger Adapter
 * @description Default built-in logger implementation using stdout/stderr
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "./adapter";
import { LOG_LEVEL, LOGGER_DEFAULTS, type LogLevel, OUTPUT_CHARS } from "./constants";
import {
  createFormatterContext,
  type FormattedOutput,
  type FormatterAdapter,
  outputToString,
  SimpleFormatterAdapter,
} from "./formatters";
import type { LogEntry, LogMetadata } from "./types";
import { LOG_LEVEL_PRIORITY } from "./types";

/**
 * Simple logger adapter - the default implementation
 * Writes formatted logs to stdout/stderr with no external dependencies
 * Supports custom formatters via FormatterAdapter
 */
export class SimpleLoggerAdapter implements LoggerAdapter {
  private minLevel: LogLevel = LOGGER_DEFAULTS.MIN_LOG_LEVEL;
  private name = "";
  private defaultMetadata?: LogMetadata;
  private formatter: FormatterAdapter;

  /**
   * Create a new SimpleLoggerAdapter
   * @param name - Optional logger name/context
   * @param defaultMetadata - Optional metadata to include in all logs
   * @param formatter - Optional custom formatter adapter
   */
  constructor(name?: string, defaultMetadata?: LogMetadata, formatter?: FormatterAdapter) {
    this.name = name ?? "";
    this.defaultMetadata = defaultMetadata;
    this.formatter = formatter ?? new SimpleFormatterAdapter();
  }

  /**
   * Initialize the adapter with configuration
   */
  initialize(config: LoggerAdapterConfig): void {
    if (config.minLevel) {
      this.minLevel = config.minLevel;
    }
    if (config.formatter) {
      this.formatter = config.formatter;
    }
  }

  /**
   * Check if a log level should be output based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  /**
   * Write a log entry to stdout/stderr
   */
  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Merge default metadata with entry metadata
    const mergedEntry: LogEntry = {
      ...entry,
      name: entry.name || this.name,
      timestamp: entry.timestamp ?? new Date().toISOString(),
      metadata: this.defaultMetadata
        ? { ...this.defaultMetadata, ...entry.metadata }
        : entry.metadata,
    };

    // Use the formatter adapter
    const context = createFormatterContext(mergedEntry);
    let output: FormattedOutput;

    switch (entry.level) {
      case LOG_LEVEL.INFO:
        output = this.formatter.formatInfo(context);
        break;
      case LOG_LEVEL.WARN:
        output = this.formatter.formatWarn(context);
        break;
      case LOG_LEVEL.DEBUG:
        output = this.formatter.formatDebug(context);
        break;
      case LOG_LEVEL.ERROR:
        output = this.formatter.formatError(context);
        break;
      default:
        output = this.formatter.formatInfo(context);
    }

    const line = outputToString(output);

    if (entry.level === LOG_LEVEL.ERROR) {
      process.stderr.write(`${line}${OUTPUT_CHARS.NEWLINE}`);
      return;
    }

    process.stdout.write(`${line}${OUTPUT_CHARS.NEWLINE}`);
  }

  /**
   * Create a child logger with inherited configuration
   */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    const childAdapter = new SimpleLoggerAdapter(
      name,
      {
        ...this.defaultMetadata,
        ...defaultMetadata,
      },
      this.formatter
    );
    childAdapter.minLevel = this.minLevel;
    return childAdapter;
  }

  /**
   * No-op flush for simple adapter (writes are synchronous)
   */
  async flush(): Promise<void> {
    // Synchronous writes, nothing to flush
  }

  /**
   * No-op destroy for simple adapter (no resources to clean up)
   */
  async destroy(): Promise<void> {
    // No resources to clean up
  }
}

/**
 * Create a pre-configured SimpleLoggerAdapter
 */
export function createSimpleAdapter(config?: LoggerAdapterConfig): SimpleLoggerAdapter {
  const adapter = new SimpleLoggerAdapter();
  adapter.initialize(config ?? {});
  return adapter;
}
