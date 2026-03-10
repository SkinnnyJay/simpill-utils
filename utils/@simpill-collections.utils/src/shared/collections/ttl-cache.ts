import { ERROR_TTL_CACHE_TTL_MS, VALUE_0 } from "../constants";

/**
 * TTL cache: entries expire after a TTL in ms. Optional max size with LRU eviction.
 * Expired entries are pruned on set(), get(key), and size to avoid unbounded growth.
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
  private readonly _map = new Map<K, Entry<V>>();
  private readonly _keyOrder: K[] = [];

  constructor(options: TTLCacheOptions) {
    this._ttlMs = options.ttlMs;
    this._maxSize = options.maxSize;
    if (this._ttlMs < VALUE_0) throw new RangeError(ERROR_TTL_CACHE_TTL_MS);
  }

  get size(): number {
    this.prune();
    return this._map.size;
  }

  get(key: K): V | undefined {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      const i = this._keyOrder.indexOf(key);
      if (i !== -1) this._keyOrder.splice(i, 1);
      return undefined;
    }
    if (this._maxSize !== undefined) {
      const i = this._keyOrder.indexOf(key);
      if (i !== -1) {
        this._keyOrder.splice(i, 1);
        this._keyOrder.push(key);
      }
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    this.prune();
    const now = Date.now();
    const expiresAt = now + this._ttlMs;
    const had = this._map.has(key);
    this._map.set(key, { value, expiresAt });
    if (!had && this._maxSize !== undefined) {
      this._keyOrder.push(key);
      while (this._keyOrder.length > this._maxSize) {
        const k = this._keyOrder.shift();
        if (k !== undefined) this._map.delete(k);
      }
    }
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    const ok = this._map.delete(key);
    if (ok && this._maxSize !== undefined) {
      const i = this._keyOrder.indexOf(key);
      if (i !== -1) this._keyOrder.splice(i, 1);
    }
    return ok;
  }

  clear(): void {
    this._map.clear();
    this._keyOrder.length = 0;
  }

  private prune(): void {
    const now = Date.now();
    for (const [k, entry] of this._map.entries()) {
      if (now > entry.expiresAt) {
        this._map.delete(k);
        const i = this._keyOrder.indexOf(k);
        if (i !== -1) this._keyOrder.splice(i, 1);
      }
    }
  }
}
