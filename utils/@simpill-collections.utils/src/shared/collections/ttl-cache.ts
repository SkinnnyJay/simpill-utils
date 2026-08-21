import { ERROR_TTL_CACHE_TTL_MS, VALUE_0, VALUE_1 } from "../constants";

/**
 * TTL cache: entries expire after a TTL in ms. Optional max size with LRU eviction.
 *
 * Performance model (all O(1) amortized; previously set() scanned the whole map and
 * recency used Array#indexOf/splice, making bulk workloads O(n^2)):
 * - Recency is the Map's own insertion order (delete + re-set moves an entry to the
 *   back, the standard ES Map LRU technique). Front of the map = least recently used.
 * - Expiry is checked lazily on get/has, and a full expiry sweep runs at most once
 *   per TTL window (so stale memory is bounded to one TTL period of writes).
 * - `size` remains exact: it forces a sweep first (O(n), matching original semantics).
 *
 * Behavioral notes vs the previous implementation (previously unspecified/untested):
 * - has() no longer refreshes recency (standard cache convention) and now works
 *   correctly for stored `undefined` values.
 * - set() on an existing key refreshes its recency (true LRU; previously only get did).
 */
export interface TTLCacheOptions {
  ttlMs: number;
  maxSize?: number;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private readonly _ttlMs: number;
  private readonly _maxSize: number | undefined;
  /** Recency-ordered: least recently used at the front. */
  private readonly _map = new Map<K, Entry<V>>();
  private _nextSweepAt = VALUE_0;

  constructor(options: TTLCacheOptions) {
    this._ttlMs = options.ttlMs;
    this._maxSize = options.maxSize;
    if (this._ttlMs < VALUE_0) throw new RangeError(ERROR_TTL_CACHE_TTL_MS);
  }

  get size(): number {
    this.sweep(Date.now());
    return this._map.size;
  }

  get(key: K): V | undefined {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return undefined;
    }
    if (this._maxSize !== undefined) {
      // Touch: move to the back (most recently used) in O(1).
      this._map.delete(key);
      this._map.set(key, entry);
    }
    return entry.value;
  }

  /** Like get(), but never refreshes recency. */
  peek(key: K): V | undefined {
    const entry = this._map.get(key);
    if (!entry || Date.now() > entry.expiresAt) return undefined;
    return entry.value;
  }

  /** Remaining lifetime in ms, or undefined if absent/expired. */
  getRemainingTTL(key: K): number | undefined {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    const remaining = entry.expiresAt - Date.now();
    return remaining < VALUE_0 ? undefined : remaining;
  }

  set(key: K, value: V): void {
    const now = Date.now();
    this.maybeSweep(now);
    // delete + set keeps updated keys at the back (most recent) of the map.
    this._map.delete(key);
    this._map.set(key, { value, expiresAt: now + this._ttlMs });
    if (this._maxSize !== undefined) {
      while (this._map.size > this._maxSize) {
        const oldest = this._map.keys().next().value as K;
        this._map.delete(oldest);
      }
    }
  }

  has(key: K): boolean {
    const entry = this._map.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    return this._map.delete(key);
  }

  clear(): void {
    this._map.clear();
    this._nextSweepAt = VALUE_0;
  }

  /** Live entries, least recently used first. Expired entries are skipped. */
  *entries(): IterableIterator<[K, V]> {
    const now = Date.now();
    for (const [key, entry] of this._map) {
      if (now <= entry.expiresAt) yield [key, entry.value];
    }
  }

  *keys(): IterableIterator<K> {
    for (const [key] of this.entries()) yield key;
  }

  *values(): IterableIterator<V> {
    for (const [, value] of this.entries()) yield value;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  /** Full expiry sweep, at most once per TTL window (amortized O(1) per op). */
  private maybeSweep(now: number): void {
    if (now < this._nextSweepAt) return;
    this._nextSweepAt = now + Math.max(this._ttlMs, VALUE_1);
    this.sweep(now);
  }

  private sweep(now: number): void {
    for (const [key, entry] of this._map) {
      if (now > entry.expiresAt) this._map.delete(key);
    }
  }
}
