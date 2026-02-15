import { ERROR_TTL_MS_MUST_BE_POSITIVE, VALUE_0 } from "../shared/constants";

/**
 * TTL cache: entries expire after a given milliseconds.
 * Expired entries are pruned on set(), get(key), and size so the map does not grow unbounded.
 */
export interface TTLEntry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private map = new Map<K, TTLEntry<V>>();
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    if (ttlMs <= VALUE_0) throw new Error(ERROR_TTL_MS_MUST_BE_POSITIVE);
    this.ttlMs = ttlMs;
  }

  set(key: K, value: V): void {
    this.prune();
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

  get size(): number {
    this.prune();
    return this.map.size;
  }

  private prune(): void {
    const now = Date.now();
    for (const [k, e] of this.map.entries()) {
      if (now > e.expiresAt) this.map.delete(k);
    }
  }

  clear(): void {
    this.map.clear();
  }
}
