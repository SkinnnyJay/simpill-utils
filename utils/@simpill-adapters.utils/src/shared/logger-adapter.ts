/** Structured log payload: message plus optional level and arbitrary metadata. */
export interface LogPayload {
  message: string;
  level?: string;
  [key: string]: unknown;
}

/** Log level names in ascending severity order. */
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

/** A log level: `"debug" | "info" | "warn" | "error"`. */
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Minimal logger interface that adapters can implement.
 * Compatible with console, pino, winston, etc. Use LogPayload for structured adapter input when applicable.
 */
export interface LoggerAdapter {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Wraps a console-like object into LoggerAdapter. Any missing method
 * (debug, info, warn, error) falls back to `log`, so a minimal
 * `{ log }`-only object is a valid input. Methods are looked up at call
 * time, so spies/patches installed after wrapping are still honored.
 */
export function consoleLoggerAdapter(consoleLike: {
  debug?: (m: string, ...a: unknown[]) => void;
  log: (m: string, ...a: unknown[]) => void;
  info?: (m: string, ...a: unknown[]) => void;
  warn?: (m: string, ...a: unknown[]) => void;
  error?: (m: string, ...a: unknown[]) => void;
}): LoggerAdapter {
  return {
    debug: (m, ...a) => (consoleLike.debug ?? consoleLike.log).call(consoleLike, m, ...a),
    info: (m, ...a) => (consoleLike.info ?? consoleLike.log).call(consoleLike, m, ...a),
    warn: (m, ...a) => (consoleLike.warn ?? consoleLike.log).call(consoleLike, m, ...a),
    error: (m, ...a) => (consoleLike.error ?? consoleLike.log).call(consoleLike, m, ...a),
  };
}

/** Logger adapter that discards everything. Useful for tests and DI defaults. */
export const noopLoggerAdapter: LoggerAdapter = Object.freeze({
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
});

/**
 * Returns a LoggerAdapter that prepends `prefix` to every message.
 * Useful for tagging a shared logger per subsystem without a full child-logger API.
 */
export function prefixLoggerAdapter(logger: LoggerAdapter, prefix: string): LoggerAdapter {
  return {
    debug: (m, ...a) => logger.debug(prefix + m, ...a),
    info: (m, ...a) => logger.info(prefix + m, ...a),
    warn: (m, ...a) => logger.warn(prefix + m, ...a),
    error: (m, ...a) => logger.error(prefix + m, ...a),
  };
}

/**
 * Returns a LoggerAdapter that forwards only calls at or above `minLevel`
 * (debug < info < warn < error) and drops the rest.
 */
export function levelFilterLoggerAdapter(logger: LoggerAdapter, minLevel: LogLevel): LoggerAdapter {
  const threshold = LOG_LEVELS.indexOf(minLevel);
  if (threshold === -1) {
    throw new RangeError(
      `levelFilterLoggerAdapter: unknown level "${String(minLevel)}" (expected ${LOG_LEVELS.join("|")})`
    );
  }
  const forward =
    (index: number, method: (m: string, ...a: unknown[]) => void) =>
    (m: string, ...a: unknown[]) => {
      if (index >= threshold) method.call(logger, m, ...a);
    };
  return {
    debug: forward(0, logger.debug),
    info: forward(1, logger.info),
    warn: forward(2, logger.warn),
    error: forward(3, logger.error),
  };
}
