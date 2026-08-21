import type { ILogger, ILoggingIntegration } from "../shared/interfaces";

/** Log levels ordered by severity for minLevel filtering. */
export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * Console-based logger implementing ILogger.
 * For production, prefer an app logger (e.g. @simpill/logger.utils) and pass it to your integration.
 */
function createConsoleLogger(name?: string): ILogger {
  const prefix = name ? `[${name}] ` : "";
  return {
    info(msg: string, meta?: Record<string, unknown>): void {
      console.info(prefix + msg, meta ?? undefined);
    },
    warn(msg: string, meta?: Record<string, unknown>): void {
      console.warn(prefix + msg, meta ?? undefined);
    },
    error(msg: string, meta?: Record<string, unknown>): void {
      console.error(prefix + msg, meta ?? undefined);
    },
    debug(msg: string, meta?: Record<string, unknown>): void {
      console.debug(prefix + msg, meta ?? undefined);
    },
  };
}

/**
 * Default logging integration using console; context provider can be set for correlation.
 * Intended for development or default wiring. For production, use an app logger (e.g. @simpill/logger.utils).
 * Optional minLevel drops lower-severity calls BEFORE context lookup and meta merging,
 * so disabled levels cost a single comparison instead of a context read + object spread.
 */
export function createLoggingIntegration(options?: {
  setLogContextProvider?: (provider: () => unknown) => void;
  getRequestContext?: () => unknown;
  /** Minimum level that is emitted. Default "debug" (everything, pre-uplift behavior). */
  minLevel?: LogLevel;
}): ILoggingIntegration {
  let contextProvider: (() => unknown) | null = null;
  const threshold = LEVEL_ORDER[options?.minLevel ?? "debug"];

  return {
    setLogContextProvider(provider: () => unknown): void {
      contextProvider = provider;
      options?.setLogContextProvider?.(provider);
    },
    getLogger(name?: string): ILogger {
      const base = createConsoleLogger(name);
      const getCtx = (): Record<string, unknown> => {
        const ctx = contextProvider ? contextProvider() : options?.getRequestContext?.();
        return ctx && typeof ctx === "object" && ctx !== null
          ? (ctx as Record<string, unknown>)
          : {};
      };
      const emit = (
        level: LogLevel,
        msg: string,
        meta: Record<string, unknown> | undefined
      ): void => {
        if (LEVEL_ORDER[level] < threshold) {
          return;
        }
        base[level](msg, { ...getCtx(), ...meta });
      };
      return {
        info(msg, meta) {
          emit("info", msg, meta);
        },
        warn(msg, meta) {
          emit("warn", msg, meta);
        },
        error(msg, meta) {
          emit("error", msg, meta);
        },
        debug(msg, meta) {
          emit("debug", msg, meta);
        },
      };
    },
  };
}
