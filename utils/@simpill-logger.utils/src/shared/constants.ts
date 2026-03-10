import {
  ENV_BOOLEAN_PARSING,
  LOG_ENV_KEYS,
  LOG_FORMAT_VALUES as PROTOCOL_LOG_FORMAT_VALUES,
} from "@simpill/protocols.utils";

export const LOG_LEVEL = {
  INFO: "INFO",
  WARN: "WARN",
  DEBUG: "DEBUG",
  ERROR: "ERROR",
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const LOG_LEVEL_LOWER = {
  INFO: "info",
  WARN: "warn",
  DEBUG: "debug",
  ERROR: "error",
} as const;

export type LogLevelLower = (typeof LOG_LEVEL_LOWER)[keyof typeof LOG_LEVEL_LOWER];

export type LoggableLevel = Exclude<LogLevelLower, "error">;

export const LOGGER_CONTEXT = {
  DEFAULT: "Logger",
  LOG_INSTANCE: "Log",
} as const;

export type LoggerContext = (typeof LOGGER_CONTEXT)[keyof typeof LOGGER_CONTEXT];

export const METADATA_KEYS = {
  TABLE: "table",
  TIMESTAMP: "timestamp",
  LEVEL: "level",
  NAME: "name",
} as const;

export type MetadataKey = (typeof METADATA_KEYS)[keyof typeof METADATA_KEYS];

export const LOGGER_DEFAULTS = {
  TIMESTAMP_FORMAT: "ISO",
  MIN_LOG_LEVEL: LOG_LEVEL.DEBUG,
  MAX_METADATA_DEPTH: 5,
  MAX_CACHE_SIZE: 1000,
  MAX_ERROR_CAUSE_DEPTH: 3,
} as const;

export const ERROR_KEYS = {
  SERIALIZATION_ERROR: "_serializationError",
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];

export const ERROR_MESSAGES = {
  SERIALIZATION_FAILED: "Failed to serialize metadata",
  ADAPTER_FAILED: "Adapter failed",
  MULTI_ADAPTER_REQUIRES_ONE: "MultiTransportAdapter requires at least one adapter",
  FLUSH_FAILED: "Flush failed",
  ENTRIES_LOST: "entries lost",
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

export const LOG_PREFIX = {
  LOGGER_ERROR: "[LOGGER_ERROR]",
  FALLBACK: "[FALLBACK]",
  BUFFERED_LOGGER: "[BUFFERED_LOGGER]",
  MULTI_TRANSPORT_ERROR: "[MULTI_TRANSPORT_ERROR]",
} as const;

export type LogPrefix = (typeof LOG_PREFIX)[keyof typeof LOG_PREFIX];

export const BUFFERED_ADAPTER_DEFAULTS = {
  MAX_BUFFER_SIZE: 100,
  FLUSH_INTERVAL_MS: 1000,
} as const;

export const ENV_KEYS = LOG_ENV_KEYS;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

export const LOG_FORMAT_VALUES = PROTOCOL_LOG_FORMAT_VALUES;

export type LogFormatValue = (typeof LOG_FORMAT_VALUES)[keyof typeof LOG_FORMAT_VALUES];

export const BOOLEAN_TRUTHY_VALUES = ENV_BOOLEAN_PARSING.TRUTHY;

export type BooleanTruthyValue = (typeof BOOLEAN_TRUTHY_VALUES)[number];

export const BOOLEAN_FALSY_VALUES = ENV_BOOLEAN_PARSING.FALSY;

export type BooleanFalsyValue = (typeof BOOLEAN_FALSY_VALUES)[number];

export const OUTPUT_CHARS = {
  NEWLINE: "\n",
} as const;

export type OutputChar = (typeof OUTPUT_CHARS)[keyof typeof OUTPUT_CHARS];

export const ANSI_COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
} as const;

export type AnsiColor = (typeof ANSI_COLORS)[keyof typeof ANSI_COLORS];

export const FILE_TRANSPORT_DEFAULTS = {
  DIRECTORY: "./logs",
  COMBINED_FILENAME: "combined.log",
  ERROR_FILENAME: "error.log",
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_FILES: 5,
} as const;

export type FileTransportDefault =
  (typeof FILE_TRANSPORT_DEFAULTS)[keyof typeof FILE_TRANSPORT_DEFAULTS];
