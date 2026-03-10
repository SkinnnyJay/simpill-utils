/** Buffered adapter. Never throws; call destroy() on shutdown to flush remaining. On flush failure, the failed batch is re-prepended to the buffer; order is preserved within each batch. */

import type { LoggerAdapter, LoggerAdapterConfig } from "./adapter";
import { BUFFERED_ADAPTER_DEFAULTS } from "./constants";
import { VALUE_0 } from "./internal-constants";
import type { LogEntry, LogMetadata } from "./types";

export interface BufferedAdapterConfig {
  maxBufferSize?: number;
  flushIntervalMs?: number;
  /** Called on flush failure (default: no-op). Never throw from logger. */
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
      this.flushSync();
    }
  }

  /** Child uses same buffer and flush config. */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    return new BufferedChildAdapter(this, name, defaultMetadata);
  }

  /** Never throws; errors reported via onFlushError. */
  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === VALUE_0) {
      return;
    }

    this.isFlushing = true;
    const entries = this.buffer;
    this.buffer = [];

    try {
      for (const entry of entries) {
        this.inner.log(entry);
      }
      if (this.inner.flush) {
        await this.inner.flush();
      }
    } catch (err) {
      this.config.onFlushError(err, entries);
      this.buffer = entries.concat(this.buffer);
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

    try {
      for (const entry of entries) {
        this.inner.log(entry);
      }
    } catch (err) {
      this.config.onFlushError(err, entries);
      this.buffer = entries.concat(this.buffer);
    } finally {
      this.isFlushing = false;
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
