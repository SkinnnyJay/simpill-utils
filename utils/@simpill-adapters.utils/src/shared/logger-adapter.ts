/** Structured log payload: message plus optional level and arbitrary metadata. */
export interface LogPayload {
  message: string;
  level?: string;
  [key: string]: unknown;
}

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
 * Wraps a console-like object into LoggerAdapter.
 */
export function consoleLoggerAdapter(consoleLike: {
  debug?: (m: string, ...a: unknown[]) => void;
  log: (m: string, ...a: unknown[]) => void;
  info?: (m: string, ...a: unknown[]) => void;
  warn: (m: string, ...a: unknown[]) => void;
  error: (m: string, ...a: unknown[]) => void;
}): LoggerAdapter {
  return {
    debug: (m, ...a) => (consoleLike.debug ?? consoleLike.log).call(consoleLike, m, ...a),
    info: (m, ...a) => (consoleLike.info ?? consoleLike.log).call(consoleLike, m, ...a),
    warn: (m, ...a) => consoleLike.warn.call(consoleLike, m, ...a),
    error: (m, ...a) => consoleLike.error.call(consoleLike, m, ...a),
  };
}
