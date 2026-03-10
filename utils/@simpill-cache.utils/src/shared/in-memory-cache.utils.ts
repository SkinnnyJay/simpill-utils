/** In-memory cache with optional TTL and maxSize. When maxSize is set, eviction is LRU (least recently used). Set defaultTtlMs or maxSize to avoid unbounded growth. */
import { ERROR_MAX_SIZE_MUST_BE_POSITIVE_FINITE } from "./constants";

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
  }

  set(key: K, value: V, ttlMs?: number): void {
    const ms = ttlMs ?? this.defaultTtlMs;
    const expiresAt = ms === undefined ? Number.POSITIVE_INFINITY : Date.now() + ms;
    const had = this.store.has(key);
    if (!had && this.maxSize !== undefined && this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
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

  get size(): number {
    const now = Date.now();
    let n = 0;
    for (const e of this.store.values()) {
      if (e.expiresAt > now) n++;
    }
    return n;
  }
}
