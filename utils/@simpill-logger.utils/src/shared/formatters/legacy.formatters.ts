/** Legacy formatters for log output (backward compatibility). */

import { ERROR_KEYS, ERROR_MESSAGES } from "../constants";
import { VALUE_0 } from "../internal-constants";
import type { LogEntry, LogFormatter, LogMetadata } from "../types";

/** Serialize metadata to JSON; handles circular refs and non-serializable values. */
export function serializeMetadata(metadata: LogMetadata | undefined): string {
  if (!metadata || Object.keys(metadata).length === VALUE_0) {
    return "";
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return JSON.stringify({
      [ERROR_KEYS.SERIALIZATION_ERROR]: ERROR_MESSAGES.SERIALIZATION_FAILED,
    });
  }
}

/** Format: [LEVEL] message {metadata}. */
export const simpleFormatter: LogFormatter = (entry: LogEntry): string => {
  const { level, message, name, metadata } = entry;

  const payload: Record<string, unknown> = { name };
  if (metadata && Object.keys(metadata).length > VALUE_0) {
    Object.assign(payload, metadata);
  }

  const payloadStr = JSON.stringify(payload);
  return `[${level}] ${message} ${payloadStr}`;
};

/** Format entry as JSON (for structured logging). */
export const jsonFormatter: LogFormatter = (entry: LogEntry): string => {
  const { level, message, name, timestamp, metadata } = entry;

  const output: Record<string, unknown> = {
    level,
    message,
    name,
  };

  if (timestamp) {
    output.timestamp = timestamp;
  }

  if (metadata && Object.keys(metadata).length > VALUE_0) {
    output.metadata = metadata;
  }

  return JSON.stringify(output);
};

/** Format: [TIMESTAMP] [LEVEL] message {metadata}. */
export const timestampFormatter: LogFormatter = (entry: LogEntry): string => {
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const base = simpleFormatter(entry);
  return `[${timestamp}] ${base}`;
};

export interface FormatterOptions {
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeName?: boolean;
  jsonOutput?: boolean;
}

export function createFormatter(options: FormatterOptions = {}): LogFormatter {
  const {
    includeTimestamp = false,
    includeLevel = true,
    includeName = true,
    jsonOutput = false,
  } = options;

  if (jsonOutput) {
    return jsonFormatter;
  }

  return (entry: LogEntry): string => {
    const parts: string[] = [];

    if (includeTimestamp) {
      const timestamp = entry.timestamp ?? new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    if (includeLevel) {
      parts.push(`[${entry.level}]`);
    }

    parts.push(entry.message);

    const payload: Record<string, unknown> = {};
    if (includeName) {
      payload.name = entry.name;
    }
    if (entry.metadata && Object.keys(entry.metadata).length > VALUE_0) {
      Object.assign(payload, entry.metadata);
    }

    if (Object.keys(payload).length > VALUE_0) {
      parts.push(JSON.stringify(payload));
    }

    return parts.join(" ");
  };
}
