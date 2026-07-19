/**
 * @file Multi-Transport Logger Adapter
 * @description Composes multiple adapters to broadcast logs to multiple destinations
 *
 * @example
 * ```typescript
 * import { MultiTransportAdapter, FileLoggerAdapter } from "@simpill/logger.utils/adapters";
 * import { SimpleLoggerAdapter } from "@simpill/logger.utils/shared";
 * import { configureLoggerFactory } from "@simpill/logger.utils";
 *
 * // Log to both console and file
 * configureLoggerFactory({
 *   adapter: new MultiTransportAdapter([
 *     new SimpleLoggerAdapter(),
 *     new FileLoggerAdapter({ directory: "./logs" }),
 *   ]),
 * });
 * ```
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "../shared/adapter";
import { ERROR_MESSAGES, LOG_PREFIX, type LogLevel } from "../shared/constants";
import { VALUE_0 } from "../shared/internal-constants";
import type { LogEntry, LogMetadata } from "../shared/types";

/** Rethrow the first rejection AFTER every promise has settled. */
function rethrowFirstRejection(results: PromiseSettledResult<void>[]): void {
  for (const result of results) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }
}

/**
 * Multi-transport adapter - broadcasts logs to multiple adapters
 *
 * Use this to compose multiple logging destinations:
 * - Console + File
 * - Console + Pino
 * - File + External service
 * - Any combination of adapters
 */
export class MultiTransportAdapter implements LoggerAdapter {
  private readonly adapters: LoggerAdapter[];

  /**
   * Create a new MultiTransportAdapter
   *
   * @param adapters - Array of adapters to broadcast logs to
   * @throws Error if no adapters are provided
   */
  constructor(adapters: LoggerAdapter[]) {
    if (adapters.length === VALUE_0) {
      throw new Error(ERROR_MESSAGES.MULTI_ADAPTER_REQUIRES_ONE);
    }
    this.adapters = [...adapters];
  }

  /**
   * Initialize all child adapters with configuration
   */
  initialize(config: LoggerAdapterConfig): void {
    for (const adapter of this.adapters) {
      adapter.initialize(config);
    }
  }

  /**
   * Write a log entry to all adapters
   * Errors in one adapter don't prevent logging to others
   */
  log(entry: LogEntry): void {
    for (const adapter of this.adapters) {
      try {
        adapter.log(entry);
      } catch (err) {
        // Log adapter errors to stderr but don't propagate
        // This ensures one failing adapter doesn't break all logging
        const errorMsg = err instanceof Error ? err.message : String(err);
        process.stderr.write(
          `${LOG_PREFIX.MULTI_TRANSPORT_ERROR} ${ERROR_MESSAGES.ADAPTER_FAILED}: ${errorMsg}\n`
        );
      }
    }
  }

  /**
   * Create child loggers for all adapters
   */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    const childAdapters = this.adapters.map((adapter) => adapter.child(name, defaultMetadata));
    return new MultiTransportAdapter(childAdapters);
  }

  /**
   * Fast level gate: enabled if ANY transport would emit at this level.
   * Transports without a gate are treated as enabled (can't be skipped safely).
   */
  isLevelEnabled(level: LogLevel): boolean {
    for (const adapter of this.adapters) {
      if (!adapter.isLevelEnabled || adapter.isLevelEnabled(level)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Flush all adapters that support flushing.
   * Uses allSettled so one failing transport cannot prevent the others from
   * flushing (the frozen Promise.all rejected on the FIRST failure while other
   * flushes were abandoned mid-air); the first failure is still rethrown after
   * every transport has settled.
   */
  async flush(): Promise<void> {
    const results = await Promise.allSettled(
      this.adapters
        .filter(
          (adapter): adapter is LoggerAdapter & { flush: () => Promise<void> } =>
            adapter.flush !== undefined
        )
        .map((adapter) => adapter.flush())
    );
    rethrowFirstRejection(results);
  }

  /**
   * Destroy all adapters that support cleanup.
   * allSettled semantics: every transport gets its destroy() even when one
   * throws; the first failure is rethrown after all have settled.
   */
  async destroy(): Promise<void> {
    const results = await Promise.allSettled(
      this.adapters
        .filter(
          (adapter): adapter is LoggerAdapter & { destroy: () => Promise<void> } =>
            adapter.destroy !== undefined
        )
        .map((adapter) => adapter.destroy())
    );
    rethrowFirstRejection(results);
  }

  /**
   * Get the number of configured adapters
   */
  get adapterCount(): number {
    return this.adapters.length;
  }
}

/**
 * Create a pre-configured MultiTransportAdapter
 *
 * @param adapters - Array of adapters to compose
 * @returns Configured MultiTransportAdapter
 */
export function createMultiAdapter(adapters: LoggerAdapter[]): MultiTransportAdapter {
  return new MultiTransportAdapter(adapters);
}
