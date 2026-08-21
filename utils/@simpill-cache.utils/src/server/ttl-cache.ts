import {
  ERROR_MAX_SIZE_MUST_BE_POSITIVE_FINITE,
  ERROR_TTL_MS_MUST_BE_POSITIVE,
  VALUE_0,
} from "../shared/constants";

/**
 * TTL cache: entries expire after a given milliseconds.
 * Expiry pruning is O(expired) amortized (front-pop), not a full O(n) scan:
 * the map maintains the invariant that iteration order == expiry order
 * (every set re-inserts, so newer expiry is always at the back).
 * Optional maxSize evicts oldest-first when full.
 */
export interface TTLEntry<V> {
  value: V;
  expiresAt: number;
}

export interface TTLCacheOptions {
  /** Maximum number of entries; oldest (soonest-to-expire) evicted when full. */
  maxSize?: number;
}

export class TTLCache<K, V> {
  private map = new Map<K, TTLEntry<V>>();
  private readonly ttlMs: number;
  private readonly maxSize: number | undefined;

  constructor(ttlMs: number, options: TTLCacheOptions = {}) {
    if (Number.isNaN(ttlMs) || ttlMs <= VALUE_0) throw new Error(ERROR_TTL_MS_MUST_BE_POSITIVE);
    this.ttlMs = ttlMs;
    this.maxSize = options.maxSize;
    if (this.maxSize !== undefined && (this.maxSize <= 0 || !Number.isFinite(this.maxSize))) {
      throw new Error(ERROR_MAX_SIZE_MUST_BE_POSITIVE_FINITE);
    }
  }

  set(key: K, value: V): void {
    this.prune();
    // Delete-before-set keeps iteration order == expiry order (Map.set on an
    // existing key would otherwise keep its old position with a newer expiry,
    // breaking front-pop pruning).
    this.map.delete(key);
    if (this.maxSize !== undefined && this.map.size >= this.maxSize) {
      const first = this.map.keys().next();
      if (!first.done) this.map.delete(first.value);
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /** Remove key. Returns true if it existed. */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /** Milliseconds until the entry expires; undefined when missing or expired (expired entry removed). */
  getRemainingTTL(key: K): number | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    const remaining = entry.expiresAt - Date.now();
    if (remaining < 0) {
      this.map.delete(key);
      return undefined;
    }
    return remaining;
  }

  get size(): number {
    this.prune();
    return this.map.size;
  }

  private prune(): void {
    // Iteration order == expiry order, so stop at the first live entry.
    const now = Date.now();
    for (const [k, e] of this.map.entries()) {
      if (now > e.expiresAt) {
        this.map.delete(k);
      } else {
        break;
      }
    }
  }

  clear(): void {
    this.map.clear();
  }
}
