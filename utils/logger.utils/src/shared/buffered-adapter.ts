/**
 * @file Buffered Logger Adapter
 * @description Wraps any LoggerAdapter to provide async buffered logging
 *
 * Buffered logging prevents blocking the event loop on high-throughput logging
 * by batching writes and flushing periodically or when buffer is full.
 *
 * @example
 * ```typescript
 * import { BufferedLoggerAdapter, SimpleLoggerAdapter } from "@simpill/logger.utils";
 *
 * const buffered = new BufferedLoggerAdapter(new SimpleLoggerAdapter(), {
 *   maxBufferSize: 100,
 *   flushIntervalMs: 1000,
 * });
 *
 * configureLoggerFactory({ adapter: buffered });
 *
 * // Logs are buffered and flushed every 1s or when 100 entries accumulate
 * logger.info("This is buffered");
 *
 * // Force flush on shutdown
 * await buffered.flush();
 * ```
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "./adapter";
import { BUFFERED_ADAPTER_DEFAULTS, ERROR_MESSAGES, LOG_PREFIX } from "./constants";
import type { LogEntry, LogMetadata } from "./types";

/**
 * Configuration for BufferedLoggerAdapter
 */
export interface BufferedAdapterConfig {
  /** Maximum entries to buffer before force flush (default: 100) */
  maxBufferSize?: number;
  /** Interval in ms between automatic flushes (default: 1000) */
  flushIntervalMs?: number;
  /** Callback when flush fails (default: console.error) */
  onFlushError?: (error: unknown, entries: LogEntry[]) => void;
}

/**
 * Wraps a LoggerAdapter to provide buffered async logging
 *
 * Benefits:
 * - Non-blocking: log() returns immediately
 * - Batched writes: reduces I/O overhead
 * - Backpressure: flushes when buffer is full
 *
 * Tradeoffs:
 * - Logs may be lost on crash (call flush() on shutdown)
 * - Slight delay before logs appear
 */
export class BufferedLoggerAdapter implements LoggerAdapter {
  private readonly inner: LoggerAdapter;
  private readonly config: Required<BufferedAdapterConfig>;
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private isDestroyed = false;

  constructor(innerAdapter: LoggerAdapter, config: BufferedAdapterConfig = {}) {
    this.inner = innerAdapter;
    this.config = {
      maxBufferSize: config.maxBufferSize ?? BUFFERED_ADAPTER_DEFAULTS.MAX_BUFFER_SIZE,
      flushIntervalMs: config.flushIntervalMs ?? BUFFERED_ADAPTER_DEFAULTS.FLUSH_INTERVAL_MS,
      onFlushError:
        config.onFlushError ??
        ((err, entries) => {
          console.error(
            `${LOG_PREFIX.BUFFERED_LOGGER} ${ERROR_MESSAGES.FLUSH_FAILED}:`,
            err,
            `(${entries.length} ${ERROR_MESSAGES.ENTRIES_LOST})`
          );
        }),
    };
  }

  /**
   * Initialize the inner adapter and start flush timer
   */
  initialize(config: LoggerAdapterConfig): void {
    this.inner.initialize(config);
    this.startFlushTimer();
  }

  /**
   * Buffer a log entry for later flushing
   * Triggers immediate flush if buffer is full
   */
  log(entry: LogEntry): void {
    if (this.isDestroyed) {
      return;
    }

    this.buffer.push(entry);

    // Flush immediately if buffer is full
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flushSync();
    }
  }

  /**
   * Create a child buffered adapter
   * Children share the same buffer and flush behavior
   */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    // Create a lightweight child that writes to the same buffer
    return new BufferedChildAdapter(this, name, defaultMetadata);
  }

  /**
   * Flush all buffered entries asynchronously
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    const entries = this.buffer;
    this.buffer = [];

    try {
      for (const entry of entries) {
        this.inner.log(entry);
      }
      // Also flush inner adapter if it supports it
      if (this.inner.flush) {
        await this.inner.flush();
      }
    } catch (err) {
      this.config.onFlushError(err, entries);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Synchronous flush for immediate buffer drain
   * Used when buffer is full to prevent unbounded growth
   */
  private flushSync(): void {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    const entries = this.buffer;
    this.buffer = [];

    try {
      for (const entry of entries) {
        this.inner.log(entry);
      }
    } catch (err) {
      this.config.onFlushError(err, entries);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Stop flush timer and flush remaining entries
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.stopFlushTimer();

    // Final flush
    await this.flush();

    // Destroy inner adapter
    if (this.inner.destroy) {
      await this.inner.destroy();
    }
  }

  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.config.onFlushError(err, []);
      });
    }, this.config.flushIntervalMs);

    // Don't keep process alive just for logging
    if (typeof this.flushTimer.unref === "function") {
      this.flushTimer.unref();
    }
  }

  /**
   * Stop the periodic flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get current buffer size (for monitoring/testing)
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
}

/**
 * Lightweight child adapter that writes to parent's buffer
 */
class BufferedChildAdapter implements LoggerAdapter {
  constructor(
    private readonly parent: BufferedLoggerAdapter,
    private readonly name: string,
    private readonly defaultMetadata?: LogMetadata
  ) {}

  initialize(_config: LoggerAdapterConfig): void {
    // No-op: parent handles initialization
  }

  log(entry: LogEntry): void {
    // Merge default metadata and override name
    const mergedEntry: LogEntry = {
      ...entry,
      name: entry.name || this.name,
      metadata: this.defaultMetadata
        ? { ...this.defaultMetadata, ...entry.metadata }
        : entry.metadata,
    };
    this.parent.log(mergedEntry);
  }

  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    return new BufferedChildAdapter(this.parent, name, {
      ...this.defaultMetadata,
      ...defaultMetadata,
    });
  }

  async flush(): Promise<void> {
    return this.parent.flush();
  }

  async destroy(): Promise<void> {
    // No-op: parent handles destruction
  }
}

/**
 * Create a BufferedLoggerAdapter wrapping the given adapter
 */
export function createBufferedAdapter(
  innerAdapter: LoggerAdapter,
  config?: BufferedAdapterConfig
): BufferedLoggerAdapter {
  return new BufferedLoggerAdapter(innerAdapter, config);
}
