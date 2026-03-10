/** Logger factory: create loggers with pluggable adapters. */

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
import { VALUE_0 } from "./internal-constants";
import { SimpleLoggerAdapter } from "./simple-adapter";
import type { LogEntry, Logger, LogMetadata } from "./types";
import { normalizeErrorsInMetadata } from "./types";

let globalAdapter: LoggerAdapter | null = null;
let globalConfig: LoggerAdapterConfig = {};
let isMockEnabled = false;
let isEnvConfigApplied = false;

const loggerCache = new Map<string, Logger>();

/** Lazy env-based config on first adapter access. */
function applyEnvConfigIfNeeded(): void {
  if (isEnvConfigApplied) {
    return;
  }

  isEnvConfigApplied = true;

  if (hasEnvConfig() && Object.keys(globalConfig).length === VALUE_0) {
    globalConfig = loadAdapterConfigFromEnv();
  }
}

/** Current adapter; bootstraps from env on first use. */
function getAdapterInternal(): LoggerAdapter {
  if (!globalAdapter) {
    applyEnvConfigIfNeeded();
    globalAdapter = new SimpleLoggerAdapter();
    globalAdapter.initialize(globalConfig);
  }
  return globalAdapter;
}

/** Fallback to stderr when adapter fails (avoids loops). */
function logAdapterError(adapterError: unknown, entry: LogEntry): void {
  try {
    const errorMsg = adapterError instanceof Error ? adapterError.message : String(adapterError);
    process.stderr.write(
      `${LOG_PREFIX.LOGGER_ERROR} ${ERROR_MESSAGES.ADAPTER_FAILED}: ${errorMsg}\n`
    );
    process.stderr.write(`${LOG_PREFIX.FALLBACK} ${JSON.stringify(entry)}\n`);
  } catch {
    // Never throw from logger
  }
}

function createLoggerFromAdapter(adapter: LoggerAdapter, name: string): Logger {
  const createLogMethod =
    (level: LogLevel) =>
    (message: string, metadata?: LogMetadata): void => {
      if (isMockEnabled) {
        return;
      }

      const context = getLogContext();
      const mergedMetadata = context ? { ...context, ...metadata } : metadata;

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

/** Set adapter and/or config; clears cache when adapter changes. */
export function configureLoggerFactory(options: {
  adapter?: LoggerAdapter;
  config?: LoggerAdapterConfig;
}): void {
  if (options.adapter) {
    if (globalAdapter?.destroy) {
      globalAdapter.destroy().catch(() => {});
    }
    globalAdapter = options.adapter;
    loggerCache.clear();
  }

  if (options.config) {
    globalConfig = { ...globalConfig, ...options.config };
  }

  if (globalAdapter) {
    globalAdapter.initialize(globalConfig);
  }
}

/** Set the logger adapter (shorthand for configureLoggerFactory). */
export function setLoggerAdapter(adapter: LoggerAdapter): void {
  configureLoggerFactory({ adapter });
}

/** Create a logger for name; cached when no defaultMetadata; LRU eviction at MAX_CACHE_SIZE. No TTL—entries stay until evicted by size or clearLoggerCache(). */
export function getLogger(name: string, defaultMetadata?: LogMetadata): Logger {
  if (!defaultMetadata) {
    const cached = loggerCache.get(name);
    if (cached) {
      loggerCache.delete(name);
      loggerCache.set(name, cached);
      return cached;
    }
  }

  const adapter = getAdapterInternal();
  const childAdapter = adapter.child(name, defaultMetadata);
  const logger = createLoggerFromAdapter(childAdapter, name);

  if (!defaultMetadata) {
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

/** Clear the logger cache (e.g. when reconfiguring or in tests). */
export function clearLoggerCache(): void {
  loggerCache.clear();
}

/** Current cache size (for testing/debugging). */
export function getLoggerCacheSize(): number {
  return loggerCache.size;
}

/** Root logger (default context). */
export function getRootLogger(): Logger {
  return getLogger(LOGGER_CONTEXT.DEFAULT);
}

/** Enable mock mode (suppresses output; for tests). */
export function enableLoggerMock(): void {
  isMockEnabled = true;
}

/** Disable mock mode. */
export function disableLoggerMock(): void {
  isMockEnabled = false;
}

/** True if mock mode is enabled. */
export function isLoggerMockEnabled(): boolean {
  return isMockEnabled;
}

/** Flush all buffered logs. */
export async function flushLogs(): Promise<void> {
  if (globalAdapter?.flush) {
    await globalAdapter.flush();
  }
}

/** Reset factory to default state (for tests). */
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

/** Alias for configureLoggerFactory. */
export function configureLogger(options: {
  adapter?: LoggerAdapter;
  config?: LoggerAdapterConfig;
}): void {
  configureLoggerFactory(options);
}
