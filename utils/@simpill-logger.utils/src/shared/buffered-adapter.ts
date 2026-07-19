/**
 * Buffered adapter. Never throws; call destroy() on shutdown to flush remaining.
 *
 * On flush failure only the entries that were NOT yet delivered to the inner
 * adapter are re-prepended (entries the inner adapter already accepted are
 * never replayed, so a mid-batch failure cannot cause duplicate delivery).
 * While the inner adapter keeps failing the retry buffer is BOUNDED at
 * 2 x maxBufferSize: beyond that the oldest entries are dropped and reported
 * via onFlushError so a dead sink cannot grow memory without limit.
 */

import type { LoggerAdapter, LoggerAdapterConfig } from "./adapter";
import { BUFFERED_ADAPTER_DEFAULTS, ERROR_MESSAGES, type LogLevel } from "./constants";
import { VALUE_0 } from "./internal-constants";
import type { LogEntry, LogMetadata } from "./types";

/** Retry buffer cap = OVERFLOW_FACTOR x maxBufferSize while the inner adapter fails. */
const OVERFLOW_FACTOR = 2;

export interface BufferedAdapterConfig {
  maxBufferSize?: number;
  flushIntervalMs?: number;
  /**
   * Called on flush failure with the entries that were NOT delivered
   * (requeued for retry), and on overflow with the entries that were DROPPED.
   * Default: no-op. Never throw from logger.
   */
  onFlushError?: (error: unknown, entries: LogEntry[]) => void;
}

/** Never throws; flush on interval or when full. Call destroy() on shutdown. */
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
      onFlushError: config.onFlushError ?? ((): void => {}),
    };
  }

  initialize(config: LoggerAdapterConfig): void {
    this.inner.initialize(config);
    this.startFlushTimer();
  }

  log(entry: LogEntry): void {
    if (this.isDestroyed) {
      return;
    }

    this.buffer.push(entry);

    if (this.buffer.length >= this.config.maxBufferSize) {
      if (this.isFlushing) {
        // An async flush is in-flight; bound growth instead of skipping silently
        this.enforceOverflowCap();
        return;
      }
      this.flushSync();
    }
  }

  /** Child uses same buffer and flush config. */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    return new BufferedChildAdapter(this, name, defaultMetadata);
  }

  /** Delegate the fast level gate so buffering doesn't defeat it. */
  isLevelEnabled(level: LogLevel): boolean {
    return this.inner.isLevelEnabled ? this.inner.isLevelEnabled(level) : true;
  }

  /**
   * Never throws; errors reported via onFlushError. Concurrent calls are
   * serialized: awaiting flush() during an in-flight flush waits for that
   * flush to complete instead of resolving early with entries still in the air.
   */
  async flush(): Promise<void> {
    this.pendingFlush = this.pendingFlush.then(() => this.doFlush());
    return this.pendingFlush;
  }

  private async doFlush(): Promise<void> {
    if (this.buffer.length === VALUE_0) {
      return;
    }

    this.isFlushing = true;
    const entries = this.buffer;
    this.buffer = [];

    let delivered = 0;
    try {
      for (const entry of entries) {
        this.inner.log(entry);
        delivered++;
      }
      if (this.inner.flush) {
        await this.inner.flush();
      }
    } catch (err) {
      // Requeue ONLY the undelivered remainder — entries the inner adapter
      // already accepted must not be replayed (duplicate delivery)
      const undelivered = entries.slice(delivered);
      this.config.onFlushError(err, undelivered);
      this.buffer = undelivered.concat(this.buffer);
      this.enforceOverflowCap();
    } finally {
      this.isFlushing = false;
    }
  }

  /** Flush synchronously when full (prevents unbounded growth). */
  private flushSync(): void {
    if (this.isFlushing || this.buffer.length === VALUE_0) {
      return;
    }

    this.isFlushing = true;
    const entries = this.buffer;
    this.buffer = [];

    let delivered = 0;
    try {
      for (const entry of entries) {
        this.inner.log(entry);
        delivered++;
      }
    } catch (err) {
      const undelivered = entries.slice(delivered);
      this.config.onFlushError(err, undelivered);
      this.buffer = undelivered.concat(this.buffer);
      this.enforceOverflowCap();
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Cap the retry buffer at OVERFLOW_FACTOR x maxBufferSize. The frozen
   * behavior re-prepended failed batches forever: with a dead inner adapter
   * the buffer grew without bound AND every subsequent log() retried the whole
   * backlog synchronously. Dropped entries are reported via onFlushError.
   */
  private enforceOverflowCap(): void {
    const cap = this.config.maxBufferSize * OVERFLOW_FACTOR;
    if (this.buffer.length <= cap) {
      return;
    }
    const dropped = this.buffer.splice(VALUE_0, this.buffer.length - cap);
    try {
      this.config.onFlushError(new Error(ERROR_MESSAGES.BUFFER_OVERFLOW), dropped);
    } catch {
      // Never throw from logger
    }
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.stopFlushTimer();

    await this.flush();

    if (this.inner.destroy) {
      await this.inner.destroy();
    }
  }

  private pendingFlush: Promise<void> = Promise.resolve();

  private startFlushTimer(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        this.config.onFlushError(err, []);
      });
    }, this.config.flushIntervalMs);

    if (typeof this.flushTimer.unref === "function") {
      this.flushTimer.unref();
    }
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /** Buffer size (for tests/monitoring). */
  getBufferSize(): number {
    return this.buffer.length;
  }
}

class BufferedChildAdapter implements LoggerAdapter {
  constructor(
    private readonly parent: BufferedLoggerAdapter,
    private readonly name: string,
    private readonly defaultMetadata?: LogMetadata
  ) {}

  initialize(_config: LoggerAdapterConfig): void {}

  log(entry: LogEntry): void {
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

  /** Delegate the fast level gate through the parent to the inner adapter. */
  isLevelEnabled(level: LogLevel): boolean {
    return this.parent.isLevelEnabled(level);
  }

  async flush(): Promise<void> {
    return this.parent.flush();
  }

  async destroy(): Promise<void> {}
}

export function createBufferedAdapter(
  innerAdapter: LoggerAdapter,
  config?: BufferedAdapterConfig
): BufferedLoggerAdapter {
  return new BufferedLoggerAdapter(innerAdapter, config);
}
