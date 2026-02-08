/**
 * Bounded LRU Map
 *
 * A Map implementation with automatic LRU (Least Recently Used) eviction
 * when the size limit is reached. Maintains access order and provides
 * monitoring capabilities.
 *
 * Use for: Caches, rate limiters, temporary stores that need size limits
 *
 * @example
 * ```typescript
 * const cache = new BoundedLRUMap<string, number>(1000, 0.8);
 * cache.set("key", 42);
 * const value = cache.get("key");
 * const stats = cache.getStats();
 * ```
 */

import { createClassLogger } from "@/lib/server/logging";

const logger = createClassLogger("BoundedLRUMap");

export interface BoundedLRUMapStats {
  size: number;
  maxSize: number;
  usagePercent: number;
  evictions: number;
}

export interface BoundedLRUMapOptions {
  /** Maximum number of entries */
  maxSize: number;
  /** Alert threshold as percentage (0-1), defaults to 0.8 (80%) */
  alertThreshold?: number;
  /** Optional name for logging */
  name?: string;
  /** Whether to log warnings when approaching limit */
  enableAlerts?: boolean;
}

/**
 * Bounded Map with LRU eviction
 */
export class BoundedLRUMap<K, V> {
  private map: Map<K, V>;
  private maxSize: number;
  private alertThreshold: number;
  private name: string;
  private enableAlerts: boolean;
  private evictions: number = 0;

  constructor(options: BoundedLRUMapOptions | number) {
    // Support both object and number constructor for convenience
    if (typeof options === "number") {
      this.maxSize = options;
      this.alertThreshold = 0.8;
      this.name = "BoundedLRUMap";
      this.enableAlerts = true;
    } else {
      this.maxSize = options.maxSize;
      this.alertThreshold = options.alertThreshold ?? 0.8;
      this.name = options.name ?? "BoundedLRUMap";
      this.enableAlerts = options.enableAlerts ?? true;
    }

    if (this.maxSize <= 0) {
      throw new Error("maxSize must be greater than 0");
    }

    this.map = new Map();
  }

  /**
   * Set a key-value pair
   * Maintains LRU order: existing keys are moved to end, new keys added at end
   */
  set(key: K, value: V): void {
    // If key exists, delete and re-add to maintain LRU order (move to end)
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict oldest entry (first in iteration order)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
        this.evictions++;
      }
    }

    this.map.set(key, value);

    // Alert if approaching limit
    if (this.enableAlerts) {
      this.checkAndAlert();
    }
  }

  /**
   * Get a value by key
   * Maintains LRU order: accessed keys are moved to end
   */
  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      // Move to end (maintain LRU order)
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Delete a key-value pair
   */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.map.clear();
    this.evictions = 0;
  }

  /**
   * Get the number of entries
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Get iterator for entries
   */
  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  /**
   * Get iterator for keys
   */
  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  /**
   * Get iterator for values
   */
  values(): IterableIterator<V> {
    return this.map.values();
  }

  /**
   * Execute a function for each entry
   */
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.map.forEach(callbackfn);
  }

  /**
   * Get statistics about the map
   */
  getStats(): BoundedLRUMapStats {
    return {
      size: this.map.size,
      maxSize: this.maxSize,
      usagePercent: Math.round((this.map.size / this.maxSize) * 100),
      evictions: this.evictions,
    };
  }

  /**
   * Check if we're approaching the limit and alert if needed
   */
  private checkAndAlert(): void {
    const usagePercent = this.map.size / this.maxSize;
    if (usagePercent >= this.alertThreshold) {
      logger.warn(`${this.name} approaching limit`, {
        size: this.map.size,
        maxSize: this.maxSize,
        usagePercent: Math.round(usagePercent * 100),
        evictions: this.evictions,
      });
    }
  }
}
