/**
 * @file Logger Constants
 * @description Centralized constants for the logger package
 */

/**
 * Log levels in uppercase format (for output)
 */
export const LOG_LEVEL = {
  INFO: "INFO",
  WARN: "WARN",
  DEBUG: "DEBUG",
  ERROR: "ERROR",
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

/**
 * Log levels in lowercase format (for method names)
 */
export const LOG_LEVEL_LOWER = {
  INFO: "info",
  WARN: "warn",
  DEBUG: "debug",
  ERROR: "error",
} as const;

export type LogLevelLower = (typeof LOG_LEVEL_LOWER)[keyof typeof LOG_LEVEL_LOWER];

/**
 * Loggable levels (excludes error for table logging)
 */
export type LoggableLevel = Exclude<LogLevelLower, "error">;

/**
 * Default logger context names
 */
export const LOGGER_CONTEXT = {
  DEFAULT: "Logger",
  LOG_INSTANCE: "Log",
} as const;

export type LoggerContext = (typeof LOGGER_CONTEXT)[keyof typeof LOGGER_CONTEXT];

/**
 * Metadata keys used in log payloads
 */
export const METADATA_KEYS = {
  TABLE: "table",
  TIMESTAMP: "timestamp",
  LEVEL: "level",
  NAME: "name",
} as const;

export type MetadataKey = (typeof METADATA_KEYS)[keyof typeof METADATA_KEYS];

/**
 * Default configuration values
 */
export const LOGGER_DEFAULTS = {
  /** Default timestamp format */
  TIMESTAMP_FORMAT: "ISO",
  /** Default log level for filtering */
  MIN_LOG_LEVEL: LOG_LEVEL.DEBUG,
  /** Maximum metadata depth for serialization */
  MAX_METADATA_DEPTH: 5,
  /** Maximum number of loggers to cache (LRU eviction when exceeded) */
  MAX_CACHE_SIZE: 1000,
  /** Maximum depth for error cause chain extraction */
  MAX_ERROR_CAUSE_DEPTH: 3,
} as const;

/**
 * Error-related constants
 */
export const ERROR_KEYS = {
  SERIALIZATION_ERROR: "_serializationError",
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];

export const ERROR_MESSAGES = {
  SERIALIZATION_FAILED: "Failed to serialize metadata",
  ADAPTER_FAILED: "Adapter failed",
  FLUSH_FAILED: "Flush failed",
  ENTRIES_LOST: "entries lost",
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

/**
 * Log prefix tags for internal logger messages
 */
export const LOG_PREFIX = {
  /** Error from logger adapter */
  LOGGER_ERROR: "[LOGGER_ERROR]",
  /** Fallback log when adapter fails */
  FALLBACK: "[FALLBACK]",
  /** Buffered logger messages */
  BUFFERED_LOGGER: "[BUFFERED_LOGGER]",
} as const;

export type LogPrefix = (typeof LOG_PREFIX)[keyof typeof LOG_PREFIX];

/**
 * Buffered adapter configuration defaults
 */
export const BUFFERED_ADAPTER_DEFAULTS = {
  /** Maximum entries to buffer before force flush */
  MAX_BUFFER_SIZE: 100,
  /** Interval in ms between automatic flushes */
  FLUSH_INTERVAL_MS: 1000,
} as const;

/**
 * Environment variable keys for logger configuration
 */
export const ENV_KEYS = {
  /** Hostname for log context (optional) */
  HOSTNAME: "HOSTNAME",
  /** Minimum log level: DEBUG, INFO, WARN, ERROR */
  LOG_LEVEL: "LOG_LEVEL",
  /** Output format: json, pretty */
  LOG_FORMAT: "LOG_FORMAT",
  /** Include timestamps: true, false */
  LOG_TIMESTAMPS: "LOG_TIMESTAMPS",
  /** Enable colored output (pretty format only): true, false */
  LOG_COLORS: "LOG_COLORS",
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

/**
 * Valid values for LOG_FORMAT environment variable
 */
export const LOG_FORMAT_VALUES = {
  JSON: "json",
  PRETTY: "pretty",
} as const;

export type LogFormatValue = (typeof LOG_FORMAT_VALUES)[keyof typeof LOG_FORMAT_VALUES];

/**
 * Boolean truthy string values for environment variable parsing
 * Used to parse boolean-like strings from environment variables
 */
export const BOOLEAN_TRUTHY_VALUES = ["true", "1", "yes"] as const;

export type BooleanTruthyValue = (typeof BOOLEAN_TRUTHY_VALUES)[number];

/**
 * Boolean falsy string values for environment variable parsing
 * Used to parse boolean-like strings from environment variables
 */
export const BOOLEAN_FALSY_VALUES = ["false", "0", "no"] as const;

export type BooleanFalsyValue = (typeof BOOLEAN_FALSY_VALUES)[number];

/**
 * Output formatting constants
 */
export const OUTPUT_CHARS = {
  /** Newline character for log output */
  NEWLINE: "\n",
} as const;

export type OutputChar = (typeof OUTPUT_CHARS)[keyof typeof OUTPUT_CHARS];

/**
 * ANSI color codes for terminal output
 * Used by ColoredFormatterAdapter for colorized log output
 */
export const ANSI_COLORS = {
  // Reset
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
} as const;

export type AnsiColor = (typeof ANSI_COLORS)[keyof typeof ANSI_COLORS];

/**
 * File transport default configuration values
 * Used by FileLoggerAdapter for disk-based logging
 */
export const FILE_TRANSPORT_DEFAULTS = {
  /** Default directory for log files */
  DIRECTORY: "./logs",
  /** Default filename for combined (all levels) log */
  COMBINED_FILENAME: "combined.log",
  /** Default filename for error-only log */
  ERROR_FILENAME: "error.log",
  /** Default maximum file size before rotation (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Default number of rotated files to keep */
  MAX_FILES: 5,
} as const;

export type FileTransportDefault =
  (typeof FILE_TRANSPORT_DEFAULTS)[keyof typeof FILE_TRANSPORT_DEFAULTS];
