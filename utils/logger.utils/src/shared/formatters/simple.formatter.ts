/**
 * @file Simple Formatter Adapter
 * @description Default formatter implementation with configurable options
 */

import { LOG_LEVEL } from "../constants";
import type { FormattedOutput, FormatterAdapter, FormatterContext } from "./formatter.adapter";

/**
 * Configuration options for SimpleFormatterAdapter
 */
export interface SimpleFormatterConfig {
  /** Include timestamp in output (default: true) */
  includeTimestamp?: boolean;
  /** Include log level in output (default: true) */
  includeLevel?: boolean;
  /** Include logger name in output (default: true) */
  includeName?: boolean;
  /** Include metadata in output (default: true) */
  includeMetadata?: boolean;
  /** Output as JSON instead of text (default: false) */
  jsonOutput?: boolean;
  /** Include PID in output (default: false) */
  includePid?: boolean;
  /** Custom level labels (e.g., { INFO: "INFORMATION", WARN: "WARNING" }) */
  levelLabels?: Partial<Record<string, string>>;
  /** Custom timestamp formatter */
  timestampFormatter?: (timestamp: string) => string;
}

/**
 * Default formatter adapter - produces human-readable log output
 *
 * @example
 * ```typescript
 * // Default format
 * const formatter = new SimpleFormatterAdapter();
 * // Output: [2024-01-01T12:00:00.000Z] [INFO] MyService: Hello world {"userId":"123"}
 *
 * // JSON format
 * const jsonFormatter = new SimpleFormatterAdapter({ jsonOutput: true });
 * // Output: {"timestamp":"...","level":"INFO","name":"MyService","message":"Hello world","metadata":{...}}
 *
 * // Minimal format
 * const minimalFormatter = new SimpleFormatterAdapter({
 *   includeTimestamp: false,
 *   includeName: false
 * });
 * // Output: [INFO] Hello world {"userId":"123"}
 * ```
 */
export class SimpleFormatterAdapter implements FormatterAdapter {
  private config: Required<Omit<SimpleFormatterConfig, "levelLabels" | "timestampFormatter">> & {
    levelLabels: Record<string, string>;
    timestampFormatter: (timestamp: string) => string;
  };

  constructor(config: SimpleFormatterConfig = {}) {
    this.config = {
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevel: config.includeLevel ?? true,
      includeName: config.includeName ?? true,
      includeMetadata: config.includeMetadata ?? true,
      jsonOutput: config.jsonOutput ?? false,
      includePid: config.includePid ?? false,
      levelLabels: {
        [LOG_LEVEL.INFO]: LOG_LEVEL.INFO,
        [LOG_LEVEL.WARN]: LOG_LEVEL.WARN,
        [LOG_LEVEL.DEBUG]: LOG_LEVEL.DEBUG,
        [LOG_LEVEL.ERROR]: LOG_LEVEL.ERROR,
        ...config.levelLabels,
      },
      timestampFormatter: config.timestampFormatter ?? ((ts) => ts),
    };
  }

  /**
   * Format a log entry based on configuration
   */
  private format(context: FormatterContext): FormattedOutput {
    if (this.config.jsonOutput) {
      return this.formatAsJson(context);
    }
    return this.formatAsText(context);
  }

  /**
   * Format as JSON object
   */
  private formatAsJson(context: FormatterContext): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    if (this.config.includeTimestamp) {
      output.timestamp = this.config.timestampFormatter(context.timestamp);
    }

    if (this.config.includeLevel) {
      output.level = context.level;
    }

    if (this.config.includeName) {
      output.name = context.loggerName;
    }

    output.message = context.message;

    if (this.config.includePid && context.pid) {
      output.pid = context.pid;
    }

    if (
      this.config.includeMetadata &&
      context.metadata &&
      Object.keys(context.metadata).length > 0
    ) {
      output.metadata = context.metadata;
    }

    return output;
  }

  /**
   * Format as human-readable text
   */
  private formatAsText(context: FormatterContext): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${this.config.timestampFormatter(context.timestamp)}]`);
    }

    if (this.config.includeLevel) {
      const label = this.config.levelLabels[context.level] ?? context.level;
      parts.push(`[${label}]`);
    }

    if (this.config.includeName) {
      parts.push(`${context.loggerName}:`);
    }

    parts.push(context.message);

    if (
      this.config.includeMetadata &&
      context.metadata &&
      Object.keys(context.metadata).length > 0
    ) {
      parts.push(JSON.stringify(context.metadata));
    }

    return parts.join(" ");
  }

  formatInfo(context: FormatterContext): FormattedOutput {
    return this.format(context);
  }

  formatWarn(context: FormatterContext): FormattedOutput {
    return this.format(context);
  }

  formatDebug(context: FormatterContext): FormattedOutput {
    return this.format(context);
  }

  formatError(context: FormatterContext): FormattedOutput {
    return this.format(context);
  }
}

/**
 * Create a SimpleFormatterAdapter with the given config
 */
export function createSimpleFormatter(config?: SimpleFormatterConfig): SimpleFormatterAdapter {
  return new SimpleFormatterAdapter(config);
}

/**
 * Pre-configured formatter instances
 */
export const defaultFormatter = new SimpleFormatterAdapter();

export const jsonFormatter = new SimpleFormatterAdapter({ jsonOutput: true });

export const minimalFormatter = new SimpleFormatterAdapter({
  includeTimestamp: false,
  includeName: false,
  includeMetadata: false,
});

export const verboseFormatter = new SimpleFormatterAdapter({
  includeTimestamp: true,
  includeLevel: true,
  includeName: true,
  includeMetadata: true,
  includePid: true,
});
