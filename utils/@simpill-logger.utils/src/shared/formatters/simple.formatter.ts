/** Default formatter with configurable options (text or JSON). */

import { LOG_LEVEL } from "../constants";
import { VALUE_0 } from "../internal-constants";
import type { FormattedOutput, FormatterAdapter, FormatterContext } from "./formatter.adapter";

export interface SimpleFormatterConfig {
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeName?: boolean;
  includeMetadata?: boolean;
  jsonOutput?: boolean;
  includePid?: boolean;
  levelLabels?: Partial<Record<string, string>>;
  timestampFormatter?: (timestamp: string) => string;
}

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

  private format(context: FormatterContext): FormattedOutput {
    if (this.config.jsonOutput) {
      return this.formatAsJson(context);
    }
    return this.formatAsText(context);
  }

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
      Object.keys(context.metadata).length > VALUE_0
    ) {
      output.metadata = context.metadata;
    }

    return output;
  }

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
      Object.keys(context.metadata).length > VALUE_0
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

export function createSimpleFormatter(config?: SimpleFormatterConfig): SimpleFormatterAdapter {
  return new SimpleFormatterAdapter(config);
}

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
