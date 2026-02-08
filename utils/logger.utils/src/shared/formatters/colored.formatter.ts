/**
 * @file Colored Formatter Adapter
 * @description Terminal-friendly formatter with ANSI color codes
 */

import { ANSI_COLORS, LOG_LEVEL } from "../constants";
import type { FormattedOutput, FormatterAdapter, FormatterContext } from "./formatter.adapter";

/**
 * Alias for ANSI_COLORS for backwards compatibility
 * @deprecated Use ANSI_COLORS from constants.ts instead
 */
const COLORS = ANSI_COLORS;

/**
 * Configuration for ColoredFormatterAdapter
 */
export interface ColoredFormatterConfig {
  /** Include timestamp (default: true) */
  includeTimestamp?: boolean;
  /** Include logger name (default: true) */
  includeName?: boolean;
  /** Include metadata (default: true) */
  includeMetadata?: boolean;
  /** Use bright/bold colors (default: true) */
  bright?: boolean;
  /** Custom colors for each level */
  colors?: {
    info?: string;
    warn?: string;
    debug?: string;
    error?: string;
    timestamp?: string;
    name?: string;
    metadata?: string;
  };
}

/**
 * Colored formatter for terminal output
 * Produces colorful, easy-to-read logs for development
 *
 * @example
 * ```typescript
 * const formatter = new ColoredFormatterAdapter();
 * // Output: [2024-01-01T12:00:00.000Z] [INFO] MyService: Hello world
 * //         (with colors: timestamp=dim, INFO=blue, name=cyan)
 *
 * // Custom colors
 * const customFormatter = new ColoredFormatterAdapter({
 *   colors: { info: COLORS.green, error: COLORS.bgRed }
 * });
 * ```
 */
export class ColoredFormatterAdapter implements FormatterAdapter {
  private config: Required<Omit<ColoredFormatterConfig, "colors">> & {
    colors: Required<NonNullable<ColoredFormatterConfig["colors"]>>;
  };

  constructor(config: ColoredFormatterConfig = {}) {
    this.config = {
      includeTimestamp: config.includeTimestamp ?? true,
      includeName: config.includeName ?? true,
      includeMetadata: config.includeMetadata ?? true,
      bright: config.bright ?? true,
      colors: {
        info: config.colors?.info ?? COLORS.blue,
        warn: config.colors?.warn ?? COLORS.yellow,
        debug: config.colors?.debug ?? COLORS.magenta,
        error: config.colors?.error ?? COLORS.red,
        timestamp: config.colors?.timestamp ?? COLORS.dim,
        name: config.colors?.name ?? COLORS.cyan,
        metadata: config.colors?.metadata ?? COLORS.dim,
      },
    };
  }

  /**
   * Apply color to text
   */
  private colorize(text: string, color: string): string {
    const bright = this.config.bright ? COLORS.bright : "";
    return `${bright}${color}${text}${COLORS.reset}`;
  }

  /**
   * Format the base log structure
   */
  private formatBase(context: FormatterContext, levelColor: string, levelLabel: string): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(this.colorize(`[${context.timestamp}]`, this.config.colors.timestamp));
    }

    parts.push(this.colorize(`[${levelLabel}]`, levelColor));

    if (this.config.includeName) {
      parts.push(this.colorize(`${context.loggerName}:`, this.config.colors.name));
    }

    parts.push(context.message);

    if (
      this.config.includeMetadata &&
      context.metadata &&
      Object.keys(context.metadata).length > 0
    ) {
      parts.push(this.colorize(JSON.stringify(context.metadata), this.config.colors.metadata));
    }

    return parts.join(" ");
  }

  formatInfo(context: FormatterContext): FormattedOutput {
    return this.formatBase(context, this.config.colors.info, LOG_LEVEL.INFO);
  }

  formatWarn(context: FormatterContext): FormattedOutput {
    return this.formatBase(context, this.config.colors.warn, LOG_LEVEL.WARN);
  }

  formatDebug(context: FormatterContext): FormattedOutput {
    return this.formatBase(context, this.config.colors.debug, LOG_LEVEL.DEBUG);
  }

  formatError(context: FormatterContext): FormattedOutput {
    return this.formatBase(context, this.config.colors.error, LOG_LEVEL.ERROR);
  }
}

/**
 * Create a ColoredFormatterAdapter with the given config
 */
export function createColoredFormatter(config?: ColoredFormatterConfig): ColoredFormatterAdapter {
  return new ColoredFormatterAdapter(config);
}

/**
 * Pre-configured colored formatter instance
 */
export const coloredFormatter = new ColoredFormatterAdapter();

/**
 * Export color constants for custom configurations
 * Re-exports ANSI_COLORS from constants.ts for convenience
 */
export { ANSI_COLORS as COLORS };
