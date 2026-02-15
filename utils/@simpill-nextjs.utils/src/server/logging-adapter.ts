import type { ILogger, ILoggingIntegration } from "../shared/interfaces";

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
 */
export function createLoggingIntegration(options?: {
  setLogContextProvider?: (provider: () => unknown) => void;
  getRequestContext?: () => unknown;
}): ILoggingIntegration {
  let contextProvider: (() => unknown) | null = null;

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
      return {
        info(msg, meta) {
          base.info(msg, { ...getCtx(), ...meta });
        },
        warn(msg, meta) {
          base.warn(msg, { ...getCtx(), ...meta });
        },
        error(msg, meta) {
          base.error(msg, { ...getCtx(), ...meta });
        },
        debug(msg, meta) {
          base.debug(msg, { ...getCtx(), ...meta });
        },
      };
    },
  };
}
