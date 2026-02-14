import { VALUE_0 } from "./constants";

/**
 * Bounded LRU Map: size-limited Map with least-recently-used eviction.
 * Optional logger for alerts when usage exceeds a threshold.
 */

/** Minimal logger interface for optional alerting. */
export interface BoundedLRUMapLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
}

export interface BoundedLRUMapStats {
  size: number;
  maxSize: number;
  usagePercent: number;
  evictions: number;
}

export interface BoundedLRUMapOptions {
  maxSize: number;
  /** Alert threshold 0–1 (default 0.8). */
  alertThreshold?: number;
  name?: string;
  enableAlerts?: boolean;
  /** Optional logger; if omitted, no alerts are emitted. */
  logger?: BoundedLRUMapLogger;
}

export class BoundedLRUMap<K, V> {
  private map: Map<K, V>;
  private maxSize: number;
  private alertThreshold: number;
  private name: string;
  private enableAlerts: boolean;
  private logger: BoundedLRUMapLogger | undefined;
  private evictions = 0;

  constructor(options: BoundedLRUMapOptions | number) {
    if (typeof options === "number") {
      this.maxSize = options;
      this.alertThreshold = 0.8;
      this.name = "BoundedLRUMap";
      this.enableAlerts = true;
      this.logger = undefined;
    } else {
      this.maxSize = options.maxSize;
      this.alertThreshold = options.alertThreshold ?? 0.8;
      this.name = options.name ?? "BoundedLRUMap";
      this.enableAlerts = options.enableAlerts ?? true;
      this.logger = options.logger;
    }

    if (this.maxSize <= VALUE_0) {
      throw new Error("maxSize must be greater than 0");
    }

    this.map = new Map();
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
        this.evictions++;
      }
    }
    this.map.set(key, value);
    if (this.enableAlerts && this.logger) {
      this.checkAndAlert();
    }
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.evictions = 0;
  }

  get size(): number {
    return this.map.size;
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.map.forEach(callbackfn);
  }

  getStats(): BoundedLRUMapStats {
    return {
      size: this.map.size,
      maxSize: this.maxSize,
      usagePercent: Math.round((this.map.size / this.maxSize) * 100),
      evictions: this.evictions,
    };
  }

  private checkAndAlert(): void {
    const usagePercent = this.map.size / this.maxSize;
    if (usagePercent >= this.alertThreshold && this.logger) {
      this.logger.warn(`${this.name} approaching limit`, {
        size: this.map.size,
        maxSize: this.maxSize,
        usagePercent: Math.round(usagePercent * 100),
        evictions: this.evictions,
      });
    }
  }
}
