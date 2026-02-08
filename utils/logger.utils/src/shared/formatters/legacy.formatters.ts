/**
 * @file Legacy Log Formatters
 * @description Formatting utilities for log output (backward compatibility)
 */

import { ERROR_KEYS, ERROR_MESSAGES } from "../constants";
import type { LogEntry, LogFormatter, LogMetadata } from "../types";

/**
 * Safely serialize metadata to JSON string
 * Handles circular references and non-serializable values
 */
export function serializeMetadata(metadata: LogMetadata | undefined): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "";
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    // Handle circular references or non-serializable values
    return JSON.stringify({
      [ERROR_KEYS.SERIALIZATION_ERROR]: ERROR_MESSAGES.SERIALIZATION_FAILED,
    });
  }
}

/**
 * Format a log entry as a simple text line
 * Format: [LEVEL] message {metadata}
 */
export const simpleFormatter: LogFormatter = (entry: LogEntry): string => {
  const { level, message, name, metadata } = entry;

  const payload: Record<string, unknown> = { name };
  if (metadata && Object.keys(metadata).length > 0) {
    Object.assign(payload, metadata);
  }

  const payloadStr = JSON.stringify(payload);
  return `[${level}] ${message} ${payloadStr}`;
};

/**
 * Format a log entry as JSON
 * Useful for structured logging systems
 */
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

  if (metadata && Object.keys(metadata).length > 0) {
    output.metadata = metadata;
  }

  return JSON.stringify(output);
};

/**
 * Format a log entry with timestamp prefix
 * Format: [TIMESTAMP] [LEVEL] message {metadata}
 */
export const timestampFormatter: LogFormatter = (entry: LogEntry): string => {
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const base = simpleFormatter(entry);
  return `[${timestamp}] ${base}`;
};

/**
 * Create a custom formatter with configurable options
 */
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
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      Object.assign(payload, entry.metadata);
    }

    if (Object.keys(payload).length > 0) {
      parts.push(JSON.stringify(payload));
    }

    return parts.join(" ");
  };
}
