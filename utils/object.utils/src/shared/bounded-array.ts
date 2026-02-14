import { VALUE_0 } from "./constants";

/**
 * Bounded Array: size-limited array with FIFO eviction when over capacity.
 * Optional logger for alerts when usage exceeds a threshold.
 */

/** Minimal logger interface for optional alerting. */
export interface BoundedArrayLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
}

export interface BoundedArrayStats {
  size: number;
  maxSize: number;
  usagePercent: number;
  evictions: number;
}

export interface BoundedArrayOptions {
  maxSize: number;
  alertThreshold?: number;
  name?: string;
  enableAlerts?: boolean;
  logger?: BoundedArrayLogger;
}

export class BoundedArray<T> {
  private array: T[];
  private maxSize: number;
  private alertThreshold: number;
  private name: string;
  private enableAlerts: boolean;
  private logger: BoundedArrayLogger | undefined;
  private evictions = 0;

  constructor(options: BoundedArrayOptions | number) {
    if (typeof options === "number") {
      this.maxSize = options;
      this.alertThreshold = 0.8;
      this.name = "BoundedArray";
      this.enableAlerts = true;
      this.logger = undefined;
    } else {
      this.maxSize = options.maxSize;
      this.alertThreshold = options.alertThreshold ?? 0.8;
      this.name = options.name ?? "BoundedArray";
      this.enableAlerts = options.enableAlerts ?? true;
      this.logger = options.logger;
    }

    if (this.maxSize <= VALUE_0) {
      throw new Error("maxSize must be greater than 0");
    }

    this.array = [];
  }

  push(item: T): void {
    this.array.push(item);
    if (this.array.length > this.maxSize) {
      this.array.shift();
      this.evictions++;
    }
    if (this.enableAlerts && this.logger) {
      this.checkAndAlert();
    }
  }

  pop(): T | undefined {
    return this.array.pop();
  }

  shift(): T | undefined {
    return this.array.shift();
  }

  unshift(item: T): void {
    this.array.unshift(item);
    if (this.array.length > this.maxSize) {
      this.array.pop();
      this.evictions++;
    }
    if (this.enableAlerts && this.logger) {
      this.checkAndAlert();
    }
  }

  get(index: number): T | undefined {
    return this.array[index];
  }

  set(index: number, item: T): void {
    if (index >= 0 && index < this.array.length) {
      this.array[index] = item;
    }
  }

  get length(): number {
    return this.array.length;
  }

  toArray(): T[] {
    return [...this.array];
  }

  [Symbol.iterator](): Iterator<T> {
    return this.array[Symbol.iterator]();
  }

  clear(): void {
    this.array = [];
    this.evictions = 0;
  }

  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
    this.array.forEach(callbackfn);
  }

  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[] {
    return this.array.map(callbackfn);
  }

  filter(callbackfn: (value: T, index: number, array: T[]) => boolean): T[] {
    return this.array.filter(callbackfn);
  }

  findIndex(predicate: (value: T, index: number, array: T[]) => boolean): number {
    return this.array.findIndex(predicate);
  }

  indexOf(searchElement: T, fromIndex?: number): number {
    return this.array.indexOf(searchElement, fromIndex);
  }

  find(predicate: (value: T, index: number, array: T[]) => boolean): T | undefined {
    return this.array.find(predicate);
  }

  slice(start?: number, end?: number): T[] {
    return this.array.slice(start, end);
  }

  splice(start: number, deleteCount?: number, ...items: T[]): T[] {
    const result = this.array.splice(start, deleteCount ?? this.array.length - start, ...items);
    while (this.array.length > this.maxSize) {
      this.array.shift();
      this.evictions++;
    }
    return result;
  }

  getStats(): BoundedArrayStats {
    return {
      size: this.array.length,
      maxSize: this.maxSize,
      usagePercent: Math.round((this.array.length / this.maxSize) * 100),
      evictions: this.evictions,
    };
  }

  private checkAndAlert(): void {
    const usagePercent = this.array.length / this.maxSize;
    if (usagePercent >= this.alertThreshold && this.logger) {
      this.logger.warn(`${this.name} approaching limit`, {
        size: this.array.length,
        maxSize: this.maxSize,
        usagePercent: Math.round(usagePercent * 100),
        evictions: this.evictions,
      });
    }
  }
}
