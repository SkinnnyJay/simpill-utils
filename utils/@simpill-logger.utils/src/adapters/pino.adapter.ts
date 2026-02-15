/**
 * @file Pino Logger Adapter
 * @description Optional Pino integration - requires 'pino' as a peer dependency
 *
 * @example
 * ```typescript
 * import pino from "pino";
 * import { PinoLoggerAdapter } from "@simpill/logger.utils/adapters/pino";
 * import { LoggerFactory } from "@simpill/logger.utils";
 *
 * // Create and configure the adapter
 * const pinoAdapter = new PinoLoggerAdapter(pino({
 *   level: "debug",
 *   transport: { target: "pino-pretty" }
 * }));
 *
 * // Register with the factory
 * LoggerFactory.setAdapter(pinoAdapter);
 *
 * // Now all loggers use Pino
 * const logger = LoggerFactory.getLogger("MyService");
 * logger.info("Using Pino!", { requestId: "123" });
 * ```
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "../shared/adapter";
import type { LogEntry, LogMetadata } from "../shared/types";

/**
 * Minimal Pino logger interface
 * This allows the adapter to work without importing pino directly
 */
export interface PinoLike {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  debug(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
  child(bindings: object): PinoLike;
  flush?(): void;
}

/**
 * Pino logger adapter
 * Wraps a Pino instance to work with the @simpill/logger.utils interface
 */
export class PinoLoggerAdapter implements LoggerAdapter {
  private pino: PinoLike;
  private name = "";

  /**
   * Create a new PinoLoggerAdapter
   *
   * @param pinoInstance - A Pino logger instance
   */
  constructor(pinoInstance: PinoLike) {
    this.pino = pinoInstance;
  }

  /**
   * Initialize the adapter
   * Note: Pino configuration should be done when creating the Pino instance
   */
  initialize(_config: LoggerAdapterConfig): void {
    // Pino is configured at instantiation, not here
    // This is intentional - Pino has its own rich configuration
  }

  /**
   * Write a log entry using Pino
   */
  log(entry: LogEntry): void {
    const { level, message, name, timestamp, metadata } = entry;

    // Build the log object
    const logObj: Record<string, unknown> = {
      name: name || this.name,
      ...(timestamp ? { timestamp } : {}),
      ...(metadata ?? {}),
    };

    // Call the appropriate Pino method
    const method = level.toLowerCase() as "info" | "warn" | "debug" | "error";
    this.pino[method](logObj, message);
  }

  /**
   * Create a child logger using Pino's child() method
   */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    const childPino = this.pino.child({
      name,
      ...(defaultMetadata ?? {}),
    });

    const childAdapter = new PinoLoggerAdapter(childPino);
    childAdapter.name = name;
    return childAdapter;
  }

  /**
   * Flush Pino's buffer (if using async transport)
   */
  async flush(): Promise<void> {
    if (this.pino.flush) {
      this.pino.flush();
    }
  }

  /**
   * Clean up (Pino handles its own cleanup)
   */
  async destroy(): Promise<void> {
    // Pino handles cleanup internally
  }
}

/**
 * Create a PinoLoggerAdapter from a Pino instance
 *
 * @param pinoInstance - A Pino logger instance
 * @returns Configured PinoLoggerAdapter
 */
export function createPinoAdapter(pinoInstance: PinoLike): PinoLoggerAdapter {
  return new PinoLoggerAdapter(pinoInstance);
}
