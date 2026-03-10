/** Terminal formatter with ANSI colors. */

import { ANSI_COLORS, LOG_LEVEL } from "../constants";
import { VALUE_0 } from "../internal-constants";
import type { FormattedOutput, FormatterAdapter, FormatterContext } from "./formatter.adapter";

/** @deprecated Use ANSI_COLORS from constants.ts instead */
const COLORS = ANSI_COLORS;

export interface ColoredFormatterConfig {
  includeTimestamp?: boolean;
  includeName?: boolean;
  includeMetadata?: boolean;
  bright?: boolean;
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

  private colorize(text: string, color: string): string {
    const bright = this.config.bright ? COLORS.bright : "";
    return `${bright}${color}${text}${COLORS.reset}`;
  }

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
      Object.keys(context.metadata).length > VALUE_0
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

export function createColoredFormatter(config?: ColoredFormatterConfig): ColoredFormatterAdapter {
  return new ColoredFormatterAdapter(config);
}

export const coloredFormatter = new ColoredFormatterAdapter();

export { ANSI_COLORS as COLORS };
