/** In-memory cache with optional TTL and maxSize. When maxSize is set, eviction is LRU (least recently used). Set defaultTtlMs or maxSize to avoid unbounded growth. Expired entries are physically removed by size reads and by capacity sweeps on set (no silent memory growth). */
import { ERROR_MAX_SIZE_MUST_BE_POSITIVE_FINITE, ERROR_TTL_MS_MUST_BE_A_NUMBER } from "./constants";

export interface InMemoryCacheOptions {
  defaultTtlMs?: number;
  maxSize?: number;
}

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class InMemoryCache<K, V> {
  private readonly store = new Map<K, Entry<V>>();
  private readonly defaultTtlMs: number | undefined;
  private readonly maxSize: number | undefined;

  constructor(options: InMemoryCacheOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs;
    this.maxSize = options.maxSize;
    if (this.maxSize !== undefined && (this.maxSize <= 0 || !Number.isFinite(this.maxSize))) {
      throw new Error(ERROR_MAX_SIZE_MUST_BE_POSITIVE_FINITE);
    }
    if (this.defaultTtlMs !== undefined && Number.isNaN(this.defaultTtlMs)) {
      throw new Error(ERROR_TTL_MS_MUST_BE_A_NUMBER);
    }
  }

  set(key: K, value: V, ttlMs?: number): void {
    if (ttlMs !== undefined && Number.isNaN(ttlMs)) {
      throw new Error(ERROR_TTL_MS_MUST_BE_A_NUMBER);
    }
    const ms = ttlMs ?? this.defaultTtlMs;
    const expiresAt = ms === undefined ? Number.POSITIVE_INFINITY : Date.now() + ms;
    const had = this.store.has(key);
    if (!had && this.maxSize !== undefined && this.store.size >= this.maxSize) {
      // Prefer reclaiming expired garbage over evicting a live LRU entry.
      this.sweepExpired();
      if (this.store.size >= this.maxSize) {
        const firstKey = this.store.keys().next();
        if (!firstKey.done) this.store.delete(firstKey.value);
      }
    }
    this.store.set(key, { value, expiresAt });
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    if (this.maxSize !== undefined) {
      this.store.delete(key);
      this.store.set(key, entry);
    }
    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    if (this.maxSize !== undefined) {
      this.store.delete(key);
      this.store.set(key, entry);
    }
    return true;
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Milliseconds until the entry expires. Infinity when no TTL; undefined when missing or already expired (expired entry is removed). */
  getRemainingTTL(key: K): number | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    const remaining = entry.expiresAt - Date.now();
    if (remaining < 0) {
      this.store.delete(key);
      return undefined;
    }
    return remaining;
  }

  /** Live (non-expired) keys. Expired entries encountered are removed. */
  *keys(): IterableIterator<K> {
    const now = Date.now();
    for (const [k, e] of this.store.entries()) {
      if (now > e.expiresAt) {
        this.store.delete(k);
      } else {
        yield k;
      }
    }
  }

  get size(): number {
    const now = Date.now();
    let n = 0;
    for (const [k, e] of this.store.entries()) {
      if (e.expiresAt > now) {
        n++;
      } else {
        // Reclaim memory: previously expired entries were counted out but never freed.
        this.store.delete(k);
      }
    }
    return n;
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [k, e] of this.store.entries()) {
      if (now > e.expiresAt) this.store.delete(k);
    }
  }
}
