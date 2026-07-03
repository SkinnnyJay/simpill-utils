/**
 * Minimal cache interface: get, set, delete, has — plus optional batch,
 * clear, and key-listing capabilities (keyv-style).
 * Implementations can be in-memory, LRU, TTL, or remote.
 */
export interface CacheAdapter<K = string, V = unknown> {
  get(key: K): V | undefined | Promise<V | undefined>;
  /** `ttlMs` is advisory: implementations without TTL support may ignore it. */
  set(key: K, value: V, ttlMs?: number): void | Promise<void>;
  delete(key: K): boolean | Promise<boolean>;
  has(key: K): boolean | Promise<boolean>;
  /** Optional: remove every entry. */
  clear?(): void | Promise<void>;
  /** Optional: batch get. Same order as `keys`, `undefined` for misses. */
  getMany?(keys: readonly K[]): (V | undefined)[] | Promise<(V | undefined)[]>;
  /** Optional: batch set (keyv entry convention: `{ key, value, ttlMs? }`). */
  setMany?(entries: readonly CacheEntry<K, V>[]): void | Promise<void>;
  /** Optional: batch delete. Booleans in the same order as `keys`. */
  deleteMany?(keys: readonly K[]): boolean[] | Promise<boolean[]>;
  /** Optional: list live (non-expired) keys. */
  keys?(): K[] | Promise<K[]>;
}

/** Batch-set entry ({@link CacheAdapter.setMany}, keyv convention). */
export interface CacheEntry<K = string, V = unknown> {
  key: K;
  value: V;
  ttlMs?: number;
}

/**
 * Fully promise-based view of a cache. Every method — including batch ops
 * and clear — is present and returns a Promise, so call sites never have to
 * reason about the sync-or-async union in {@link CacheAdapter}.
 */
export interface AsyncCacheAdapter<K = string, V = unknown> {
  get(key: K): Promise<V | undefined>;
  set(key: K, value: V, ttlMs?: number): Promise<void>;
  delete(key: K): Promise<boolean>;
  has(key: K): Promise<boolean>;
  clear(): Promise<void>;
  getMany(keys: readonly K[]): Promise<(V | undefined)[]>;
  setMany(entries: readonly CacheEntry<K, V>[]): Promise<void>;
  deleteMany(keys: readonly K[]): Promise<boolean[]>;
  keys(): Promise<K[]>;
}

/** Options for {@link memoryCacheAdapter}. */
export interface MemoryCacheOptions<K = string, V = unknown> {
  /** Default time-to-live in ms for entries set without a per-call ttl. */
  ttlMs?: number;
  /** Maximum number of entries; least-recently-used entries are evicted. */
  maxSize?: number;
  /** Called when an entry leaves the cache via eviction or lazy expiry. */
  onEvict?: (key: K, value: V, reason: "evicted" | "expired") => void;
}

/**
 * The concrete, fully synchronous shape returned by {@link memoryCacheAdapter}:
 * every optional {@link CacheAdapter} capability implemented, sync signatures.
 */
export interface MemoryCacheAdapter<K = string, V = unknown> extends CacheAdapter<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttlMs?: number): void;
  delete(key: K): boolean;
  has(key: K): boolean;
  clear(): void;
  getMany(keys: readonly K[]): (V | undefined)[];
  setMany(entries: readonly CacheEntry<K, V>[]): void;
  deleteMany(keys: readonly K[]): boolean[];
  keys(): K[];
}

/** Internal TTL wrapper. Not exported, so user values can never collide. */
class Expiring<V> {
  constructor(
    public readonly value: V,
    public readonly expiresAt: number
  ) {}
}

function validateTtl(ttlMs: number | undefined, label: string): void {
  if (ttlMs === undefined) return;
  if (typeof ttlMs !== "number") {
    throw new TypeError(`${label} must be a number when provided`);
  }
  if (Number.isNaN(ttlMs) || ttlMs <= 0 || !Number.isFinite(ttlMs)) {
    throw new RangeError(`${label} must be a positive finite number of milliseconds`);
  }
}

/**
 * In-memory cache adapter using a Map. Useful for tests or simple caching.
 *
 * With no options this behaves exactly like a plain Map (no TTL, no
 * eviction, stored `undefined` is distinguishable via `has`). Options add
 * keyv-style lazy TTL expiry (enforced at read time, no timers — safe for
 * edge runtimes) and Map-order LRU eviction bounded by `maxSize`.
 */
export function memoryCacheAdapter<K = string, V = unknown>(
  options: MemoryCacheOptions<K, V> = {}
): MemoryCacheAdapter<K, V> {
  const { ttlMs: defaultTtlMs, maxSize, onEvict } = options;
  validateTtl(defaultTtlMs, "options.ttlMs");
  if (maxSize !== undefined) {
    if (typeof maxSize !== "number" || !Number.isInteger(maxSize) || maxSize < 1) {
      throw new RangeError("options.maxSize must be an integer >= 1");
    }
  }
  const map = new Map<K, V | Expiring<V>>();
  const lru = maxSize !== undefined;
  // True once any entry with a TTL exists; keeps the no-TTL hot path free of
  // instanceof checks so plain-mode get/set stay at raw-Map speed.
  let anyTtl = defaultTtlMs !== undefined;

  function expire(key: K, stored: Expiring<V>): void {
    map.delete(key);
    onEvict?.(key, stored.value, "expired");
  }

  function touch(key: K, stored: V | Expiring<V> | undefined): void {
    if (stored !== undefined || map.has(key)) {
      map.delete(key);
      map.set(key, stored as V | Expiring<V>);
    }
  }

  function evictOverflow(): void {
    while (map.size > (maxSize as number)) {
      const oldestKey = map.keys().next().value as K;
      const oldest = map.get(oldestKey) as V | Expiring<V>;
      map.delete(oldestKey);
      onEvict?.(oldestKey, oldest instanceof Expiring ? oldest.value : (oldest as V), "evicted");
    }
  }

  const adapter: MemoryCacheAdapter<K, V> = {
    get(key: K): V | undefined {
      const stored = map.get(key);
      if (anyTtl && stored instanceof Expiring) {
        if (stored.expiresAt <= Date.now()) {
          expire(key, stored);
          return undefined;
        }
        if (lru) touch(key, stored);
        return stored.value;
      }
      if (lru) touch(key, stored);
      return stored as V | undefined;
    },
    set(key: K, value: V, ttlMs?: number): void {
      if (ttlMs === undefined && defaultTtlMs === undefined) {
        if (lru) {
          if (map.has(key)) map.delete(key);
          map.set(key, value);
          evictOverflow();
        } else {
          map.set(key, value);
        }
        return;
      }
      if (ttlMs !== undefined) validateTtl(ttlMs, "ttlMs");
      anyTtl = true;
      const stored = new Expiring(value, Date.now() + ((ttlMs ?? defaultTtlMs) as number));
      if (lru) {
        if (map.has(key)) map.delete(key);
        map.set(key, stored);
        evictOverflow();
      } else {
        map.set(key, stored);
      }
    },
    delete(key: K): boolean {
      return map.delete(key);
    },
    has(key: K): boolean {
      const stored = map.get(key);
      if (anyTtl && stored instanceof Expiring) {
        if (stored.expiresAt <= Date.now()) {
          expire(key, stored);
          return false;
        }
        return true;
      }
      return stored !== undefined || map.has(key);
    },
    clear(): void {
      map.clear();
    },
    getMany(keys: readonly K[]): (V | undefined)[] {
      return keys.map((key) => adapter.get(key));
    },
    setMany(entries: readonly CacheEntry<K, V>[]): void {
      for (const entry of entries) adapter.set(entry.key, entry.value, entry.ttlMs);
    },
    deleteMany(keys: readonly K[]): boolean[] {
      return keys.map((key) => map.delete(key));
    },
    keys(): K[] {
      const out: K[] = [];
      for (const [key, stored] of [...map.entries()]) {
        if (anyTtl && stored instanceof Expiring && stored.expiresAt <= Date.now()) {
          expire(key, stored);
          continue;
        }
        out.push(key);
      }
      return out;
    },
  };
  return adapter;
}

/** Cache adapter that stores nothing. Useful for disabling caching in DI. */
export function noopCacheAdapter<K = string, V = unknown>(): CacheAdapter<K, V> {
  return {
    get: () => undefined,
    set: () => undefined,
    delete: () => false,
    has: () => false,
    clear: () => undefined,
    getMany: (keys: readonly K[]) => keys.map(() => undefined),
    setMany: () => undefined,
    deleteMany: (keys: readonly K[]) => keys.map(() => false),
    keys: () => [],
  };
}
