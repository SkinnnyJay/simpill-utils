/** Formatter plugin interface with full context access. */

import { ENV_KEYS, LOG_LEVEL, type LogLevel } from "../constants";
import type { LogEntry, LogMetadata } from "../types";

export interface FormatterContext {
  loggerName: string;
  level: LogLevel;
  timestamp: string;
  message: string;
  metadata?: LogMetadata;
  pid?: number;
  hostname?: string;
}

export type FormattedOutput = string | Record<string, unknown>;

export interface FormatterAdapter {
  formatInfo(context: FormatterContext): FormattedOutput;
  formatWarn(context: FormatterContext): FormattedOutput;
  formatDebug(context: FormatterContext): FormattedOutput;
  formatError(context: FormatterContext): FormattedOutput;
}

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

function getHostname(): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env?.[ENV_KEYS.HOSTNAME]) {
      return process.env[ENV_KEYS.HOSTNAME];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

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

export function outputToString(output: FormattedOutput): string {
  if (typeof output === "string") {
    return output;
  }
  return JSON.stringify(output);
}
