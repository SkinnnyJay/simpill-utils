/**
 * @file Shared Exports
 * @description Runtime-agnostic logger utilities
 */

// ============================================
// Core Types and Constants
// ============================================

// Constants
export {
  ANSI_COLORS,
  type AnsiColor,
  BOOLEAN_FALSY_VALUES,
  type BooleanFalsyValue,
  BOOLEAN_TRUTHY_VALUES,
  type BooleanTruthyValue,
  BUFFERED_ADAPTER_DEFAULTS,
  ENV_KEYS,
  type EnvKey,
  ERROR_KEYS,
  ERROR_MESSAGES,
  type ErrorKey,
  type ErrorMessage,
  FILE_TRANSPORT_DEFAULTS,
  type FileTransportDefault,
  LOG_FORMAT_VALUES,
  LOG_LEVEL,
  LOG_LEVEL_LOWER,
  LOG_PREFIX,
  LOGGER_CONTEXT,
  LOGGER_DEFAULTS,
  type LogFormatValue,
  type LoggableLevel,
  type LoggerContext,
  type LogLevel,
  type LogLevelLower,
  type LogPrefix,
  METADATA_KEYS,
  type MetadataKey,
  OUTPUT_CHARS,
  type OutputChar,
} from "./constants";

// Types
export {
  type ErrorInfo,
  extractErrorInfo,
  isErrorLike,
  LOG_LEVEL_PRIORITY,
  type Log,
  type LogEntry,
  type LogFormatter,
  type Logger,
  type LoggerOptions,
  type LogMetadata,
  type LogWriter,
  normalizeErrorsInMetadata,
  shouldLog,
} from "./types";

// ============================================
// Adapter Interfaces (Plugin Architecture)
// ============================================

// Logger adapter interface
export {
  isLoggerAdapter,
  type LoggerAdapter,
  type LoggerAdapterConfig,
} from "./adapter";

// ============================================
// Formatters (from formatters/ subfolder)
// ============================================

// Formatter adapter interface
export {
  createFormatterContext,
  type FormattedOutput,
  type FormatterAdapter,
  type FormatterContext,
  formatWithAdapter,
  isFormatterAdapter,
  outputToString,
} from "./formatters";

// Simple formatter (default)
export {
  createSimpleFormatter,
  defaultFormatter,
  jsonFormatterAdapter,
  minimalFormatter,
  SimpleFormatterAdapter,
  type SimpleFormatterConfig,
  verboseFormatter,
} from "./formatters";

// Colored formatter (terminal)
export {
  COLORS,
  ColoredFormatterAdapter,
  type ColoredFormatterConfig,
  coloredFormatter,
  createColoredFormatter,
} from "./formatters";

// Legacy formatters (backward compatibility)
export {
  createFormatter,
  type FormatterOptions,
  jsonFormatter,
  serializeMetadata,
  simpleFormatter,
  timestampFormatter,
} from "./formatters";

// ============================================
// Adapter Implementations
// ============================================

// Simple adapter (default implementation)
export { createSimpleAdapter, SimpleLoggerAdapter } from "./simple-adapter";

// Buffered adapter for async logging
export {
  type BufferedAdapterConfig,
  BufferedLoggerAdapter,
  createBufferedAdapter,
} from "./buffered-adapter";

// ============================================
// Configuration
// ============================================

// Environment configuration
export {
  createFormatterFromEnv,
  ENV_DEFAULTS,
  type EnvLoggerConfig,
  envConfigToAdapterConfig,
  hasEnvConfig,
  loadAdapterConfigFromEnv,
  loadEnvConfig,
} from "./env.config";

// Context provider for correlation IDs
export {
  clearLogContextProvider,
  getLogContext,
  hasLogContextProvider,
  type LogContext,
  type LogContextProvider,
  setLogContextProvider,
  withLogContext,
} from "./context";

// ============================================
// Factory (Main Entry Point)
// ============================================

export {
  clearLoggerCache,
  configureLogger,
  configureLoggerFactory,
  disableLoggerMock,
  enableLoggerMock,
  flushLogs,
  getLogger,
  getLoggerCacheSize,
  getRootLogger,
  isLoggerMockEnabled,
  LoggerFactory,
  resetLoggerFactory,
  setLoggerAdapter,
} from "./factory";
