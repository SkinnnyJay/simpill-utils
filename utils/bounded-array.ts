/**
 * Bounded Array
 *
 * An Array implementation with automatic FIFO (First In First Out) eviction
 * when the size limit is reached. Oldest items are removed first.
 *
 * Use for: Buffers, queues, recent items lists
 *
 * @example
 * ```typescript
 * const buffer = new BoundedArray<string>(1000, 0.8);
 * buffer.push("item");
 * const item = buffer.shift();
 * const stats = buffer.getStats();
 * ```
 */

import { createClassLogger } from "@/lib/server/logging";

const logger = createClassLogger("BoundedArray");

export interface BoundedArrayStats {
  size: number;
  maxSize: number;
  usagePercent: number;
  evictions: number;
}

export interface BoundedArrayOptions {
  /** Maximum number of items */
  maxSize: number;
  /** Alert threshold as percentage (0-1), defaults to 0.8 (80%) */
  alertThreshold?: number;
  /** Optional name for logging */
  name?: string;
  /** Whether to log warnings when approaching limit */
  enableAlerts?: boolean;
}

/**
 * Bounded Array with FIFO eviction
 */
export class BoundedArray<T> {
  private array: T[];
  private maxSize: number;
  private alertThreshold: number;
  private name: string;
  private enableAlerts: boolean;
  private evictions: number = 0;

  constructor(options: BoundedArrayOptions | number) {
    // Support both object and number constructor for convenience
    if (typeof options === "number") {
      this.maxSize = options;
      this.alertThreshold = 0.8;
      this.name = "BoundedArray";
      this.enableAlerts = true;
    } else {
      this.maxSize = options.maxSize;
      this.alertThreshold = options.alertThreshold ?? 0.8;
      this.name = options.name ?? "BoundedArray";
      this.enableAlerts = options.enableAlerts ?? true;
    }

    if (this.maxSize <= 0) {
      throw new Error("maxSize must be greater than 0");
    }

    this.array = [];
  }

  /**
   * Add item to end of array
   * Removes oldest item if at capacity
   */
  push(item: T): void {
    this.array.push(item);
    if (this.array.length > this.maxSize) {
      this.array.shift(); // Remove oldest
      this.evictions++;
    }

    if (this.enableAlerts) {
      this.checkAndAlert();
    }
  }

  /**
   * Remove and return last item
   */
  pop(): T | undefined {
    return this.array.pop();
  }

  /**
   * Remove and return first item
   */
  shift(): T | undefined {
    return this.array.shift();
  }

  /**
   * Add item to beginning of array
   * Removes last item if at capacity
   */
  unshift(item: T): void {
    this.array.unshift(item);
    if (this.array.length > this.maxSize) {
      this.array.pop(); // Remove last
      this.evictions++;
    }

    if (this.enableAlerts) {
      this.checkAndAlert();
    }
  }

  /**
   * Get item at index
   */
  get(index: number): T | undefined {
    return this.array[index];
  }

  /**
   * Set item at index
   */
  set(index: number, item: T): void {
    if (index >= 0 && index < this.array.length) {
      this.array[index] = item;
    }
  }

  /**
   * Get array length
   */
  get length(): number {
    return this.array.length;
  }

  /**
   * Get all items as array (copy)
   */
  toArray(): T[] {
    return [...this.array];
  }

  /**
   * Iterator support - enables spread operator and for...of
   */
  [Symbol.iterator](): Iterator<T> {
    return this.array[Symbol.iterator]();
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.array = [];
    this.evictions = 0;
  }

  /**
   * Execute a function for each item
   */
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
    this.array.forEach(callbackfn);
  }

  /**
   * Map over items
   */
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[] {
    return this.array.map(callbackfn);
  }

  /**
   * Filter items
   */
  filter(callbackfn: (value: T, index: number, array: T[]) => boolean): T[] {
    return this.array.filter(callbackfn);
  }

  /**
   * Find index of item matching predicate
   */
  findIndex(predicate: (value: T, index: number, array: T[]) => boolean): number {
    return this.array.findIndex(predicate);
  }

  /**
   * Find index of item (by value)
   */
  indexOf(searchElement: T, fromIndex?: number): number {
    return this.array.indexOf(searchElement, fromIndex);
  }

  /**
   * Find item matching predicate
   */
  find(predicate: (value: T, index: number, array: T[]) => boolean): T | undefined {
    return this.array.find(predicate);
  }

  /**
   * Slice array (returns copy)
   */
  slice(start?: number, end?: number): T[] {
    return this.array.slice(start, end);
  }

  /**
   * Splice array (modifies in place)
   * Note: This can exceed maxSize temporarily, but will be bounded on next push
   */
  splice(start: number, deleteCount?: number, ...items: T[]): T[] {
    const result = this.array.splice(start, deleteCount ?? this.array.length - start, ...items);
    // If we added items and exceeded max, trim from beginning
    while (this.array.length > this.maxSize) {
      this.array.shift();
      this.evictions++;
    }
    return result;
  }

  /**
   * Get statistics about the array
   */
  getStats(): BoundedArrayStats {
    return {
      size: this.array.length,
      maxSize: this.maxSize,
      usagePercent: Math.round((this.array.length / this.maxSize) * 100),
      evictions: this.evictions,
    };
  }

  /**
   * Check if we're approaching the limit and alert if needed
   */
  private checkAndAlert(): void {
    const usagePercent = this.array.length / this.maxSize;
    if (usagePercent >= this.alertThreshold) {
      logger.warn(`${this.name} approaching limit`, {
        size: this.array.length,
        maxSize: this.maxSize,
        usagePercent: Math.round(usagePercent * 100),
        evictions: this.evictions,
      });
    }
  }
}
