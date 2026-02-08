/**
 * @file Logger Factory
 * @description Central factory for creating loggers with pluggable adapters
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "./adapter";
import {
  ERROR_MESSAGES,
  LOG_LEVEL,
  LOG_PREFIX,
  LOGGER_CONTEXT,
  LOGGER_DEFAULTS,
  type LogLevel,
} from "./constants";
import { getLogContext } from "./context";
import { hasEnvConfig, loadAdapterConfigFromEnv } from "./env.config";
import { SimpleLoggerAdapter } from "./simple-adapter";
import type { LogEntry, Logger, LogMetadata } from "./types";
import { normalizeErrorsInMetadata } from "./types";

/**
 * Global state for the logger factory
 */
let globalAdapter: LoggerAdapter | null = null;
let globalConfig: LoggerAdapterConfig = {};
let isMockEnabled = false;
let isEnvConfigApplied = false;

/**
 * Cache for loggers without custom metadata
 * Key is the logger name, value is the Logger instance
 */
const loggerCache = new Map<string, Logger>();

/**
 * Apply environment configuration if not already applied
 * This is called lazily on first adapter access
 */
function applyEnvConfigIfNeeded(): void {
  if (isEnvConfigApplied) {
    return;
  }

  isEnvConfigApplied = true;

  // Only apply env config if environment variables are set
  // and no explicit config has been provided
  if (hasEnvConfig() && Object.keys(globalConfig).length === 0) {
    globalConfig = loadAdapterConfigFromEnv();
  }
}

/**
 * Get the current adapter, creating default if needed
 * Auto-bootstraps from environment variables on first use
 */
function getAdapterInternal(): LoggerAdapter {
  if (!globalAdapter) {
    applyEnvConfigIfNeeded();
    globalAdapter = new SimpleLoggerAdapter();
    globalAdapter.initialize(globalConfig);
  }
  return globalAdapter;
}

/**
 * Fallback logging when adapter fails
 * Writes directly to stderr to avoid infinite loops
 */
function logAdapterError(adapterError: unknown, entry: LogEntry): void {
  try {
    const errorMsg = adapterError instanceof Error ? adapterError.message : String(adapterError);
    process.stderr.write(
      `${LOG_PREFIX.LOGGER_ERROR} ${ERROR_MESSAGES.ADAPTER_FAILED}: ${errorMsg}\n`
    );
    process.stderr.write(`${LOG_PREFIX.FALLBACK} ${JSON.stringify(entry)}\n`);
  } catch {
    // Last resort - if even stderr fails, silently drop
    // Never throw from a logger
  }
}

/**
 * Create a Logger interface from an adapter
 */
function createLoggerFromAdapter(adapter: LoggerAdapter, name: string): Logger {
  const createLogMethod =
    (level: LogLevel) =>
    (message: string, metadata?: LogMetadata): void => {
      if (isMockEnabled) {
        return;
      }

      // Merge context provider data with explicit metadata
      // Explicit metadata takes precedence over context
      const context = getLogContext();
      const mergedMetadata = context ? { ...context, ...metadata } : metadata;

      // Auto-extract Error objects in metadata to structured ErrorInfo
      const normalizedMetadata = normalizeErrorsInMetadata(mergedMetadata);

      const entry: LogEntry = {
        level,
        message,
        name,
        timestamp: new Date().toISOString(),
        metadata: normalizedMetadata,
      };

      try {
        adapter.log(entry);
      } catch (err) {
        // Never let logging crash the application
        logAdapterError(err, entry);
      }
    };

  return {
    info: createLogMethod(LOG_LEVEL.INFO),
    warn: createLogMethod(LOG_LEVEL.WARN),
    debug: createLogMethod(LOG_LEVEL.DEBUG),
    error: createLogMethod(LOG_LEVEL.ERROR),
  };
}

/**
 * Configure the logger factory with an adapter and options
 *
 * @param options - Configuration options
 * @param options.adapter - Logger adapter implementation
 * @param options.config - Adapter configuration
 *
 * @example
 * ```typescript
 * // Use default simple adapter
 * const logger = getLogger("MyService");
 * logger.info("Hello world");
 *
 * // Configure with custom adapter
 * configureLoggerFactory({
 *   adapter: new PinoAdapter(),
 *   config: { minLevel: "INFO", prettyPrint: true }
 * });
 *
 * // All loggers now use Pino
 * const pinoLogger = getLogger("MyService");
 * pinoLogger.info("Now using Pino!");
 * ```
 */
export function configureLoggerFactory(options: {
  adapter?: LoggerAdapter;
  config?: LoggerAdapterConfig;
}): void {
  if (options.adapter) {
    // Clean up previous adapter if it has a destroy method
    if (globalAdapter?.destroy) {
      globalAdapter.destroy().catch(() => {
        // Ignore cleanup errors
      });
    }
    globalAdapter = options.adapter;
    // Clear cache when adapter changes since cached loggers use the old adapter
    loggerCache.clear();
  }

  if (options.config) {
    globalConfig = { ...globalConfig, ...options.config };
  }

  // Initialize the adapter with the merged config
  if (globalAdapter) {
    globalAdapter.initialize(globalConfig);
  }
}

/**
 * Set the logger adapter (shorthand for configureLoggerFactory)
 *
 * @param adapter - Logger adapter implementation
 */
export function setLoggerAdapter(adapter: LoggerAdapter): void {
  configureLoggerFactory({ adapter });
}

/**
 * Create a logger for a specific context/class
 *
 * Loggers without custom metadata are cached to avoid repeated instantiation.
 * Loggers with custom metadata are always created fresh since the metadata
 * may differ between calls.
 *
 * Cache uses LRU eviction when MAX_CACHE_SIZE is exceeded to prevent unbounded growth.
 *
 * @param name - Logger name/context for identification
 * @param defaultMetadata - Optional metadata to include in all logs
 * @returns Logger instance
 */
export function getLogger(name: string, defaultMetadata?: LogMetadata): Logger {
  // Return cached logger if no custom metadata and already exists
  if (!defaultMetadata) {
    const cached = loggerCache.get(name);
    if (cached) {
      // Move to end for LRU (delete and re-add)
      loggerCache.delete(name);
      loggerCache.set(name, cached);
      return cached;
    }
  }

  const adapter = getAdapterInternal();
  const childAdapter = adapter.child(name, defaultMetadata);
  const logger = createLoggerFromAdapter(childAdapter, name);

  // Cache loggers without custom metadata
  if (!defaultMetadata) {
    // Evict oldest entry if at capacity (LRU eviction)
    if (loggerCache.size >= LOGGER_DEFAULTS.MAX_CACHE_SIZE) {
      const oldestKey = loggerCache.keys().next().value;
      if (oldestKey !== undefined) {
        loggerCache.delete(oldestKey);
      }
    }
    loggerCache.set(name, logger);
  }

  return logger;
}

/**
 * Clear the logger cache
 * Useful when reconfiguring the factory or in tests
 */
export function clearLoggerCache(): void {
  loggerCache.clear();
}

/**
 * Get the current cache size (for testing/debugging)
 */
export function getLoggerCacheSize(): number {
  return loggerCache.size;
}

/**
 * Get the root logger (uses default context)
 */
export function getRootLogger(): Logger {
  return getLogger(LOGGER_CONTEXT.DEFAULT);
}

/**
 * Enable mock mode (suppresses all log output)
 * Useful for testing
 */
export function enableLoggerMock(): void {
  isMockEnabled = true;
}

/**
 * Disable mock mode (restores normal log output)
 */
export function disableLoggerMock(): void {
  isMockEnabled = false;
}

/**
 * Check if mock mode is enabled
 */
export function isLoggerMockEnabled(): boolean {
  return isMockEnabled;
}

/**
 * Flush all buffered logs
 */
export async function flushLogs(): Promise<void> {
  if (globalAdapter?.flush) {
    await globalAdapter.flush();
  }
}

/**
 * Reset the factory to default state
 * Useful for testing
 */
export async function resetLoggerFactory(): Promise<void> {
  if (globalAdapter?.destroy) {
    await globalAdapter.destroy();
  }
  globalAdapter = null;
  globalConfig = {};
  isMockEnabled = false;
  isEnvConfigApplied = false;
  loggerCache.clear();
}

/**
 * LoggerFactory namespace for backwards compatibility
 * @deprecated Use individual exported functions instead
 */
export const LoggerFactory = {
  configure: configureLoggerFactory,
  setAdapter: setLoggerAdapter,
  getLogger,
  clearCache: clearLoggerCache,
  getCacheSize: getLoggerCacheSize,
  getRootLogger,
  enableMock: enableLoggerMock,
  disableMock: disableLoggerMock,
  isMockEnabled: isLoggerMockEnabled,
  flush: flushLogs,
  reset: resetLoggerFactory,
};

/**
 * Convenience function to configure the factory
 * Alias for configureLoggerFactory
 */
export function configureLogger(options: {
  adapter?: LoggerAdapter;
  config?: LoggerAdapterConfig;
}): void {
  configureLoggerFactory(options);
}
