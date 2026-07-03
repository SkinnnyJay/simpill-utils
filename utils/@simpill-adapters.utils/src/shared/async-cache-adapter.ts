import type { AsyncCacheAdapter, CacheAdapter, CacheEntry } from "./cache-adapter";

/**
 * Normalizes any {@link CacheAdapter} (sync, async, or mixed) into a fully
 * promise-based {@link AsyncCacheAdapter}, killing the sync-or-async union
 * at call sites. Batch operations use the underlying adapter's native
 * `getMany`/`setMany`/`deleteMany` when present and fall back to the
 * singular operations otherwise (keyv convention). `clear()` uses native
 * `clear`, falls back to `keys()` + delete, and otherwise rejects with a
 * descriptive TypeError instead of silently doing nothing.
 */
export function asAsyncCacheAdapter<K = string, V = unknown>(
  cache: CacheAdapter<K, V>
): AsyncCacheAdapter<K, V> {
  return {
    async get(key: K): Promise<V | undefined> {
      return await cache.get(key);
    },
    async set(key: K, value: V, ttlMs?: number): Promise<void> {
      await cache.set(key, value, ttlMs);
    },
    async delete(key: K): Promise<boolean> {
      return await cache.delete(key);
    },
    async has(key: K): Promise<boolean> {
      return await cache.has(key);
    },
    async clear(): Promise<void> {
      if (cache.clear) {
        await cache.clear();
        return;
      }
      if (cache.keys) {
        const keys = await cache.keys();
        await Promise.all(keys.map((key) => cache.delete(key)));
        return;
      }
      throw new TypeError(
        "asAsyncCacheAdapter: underlying cache supports neither clear() nor keys(); clear is impossible"
      );
    },
    async getMany(keys: readonly K[]): Promise<(V | undefined)[]> {
      if (cache.getMany) return await cache.getMany(keys);
      return await Promise.all(keys.map((key) => cache.get(key)));
    },
    async setMany(entries: readonly CacheEntry<K, V>[]): Promise<void> {
      if (cache.setMany) {
        await cache.setMany(entries);
        return;
      }
      await Promise.all(entries.map((entry) => cache.set(entry.key, entry.value, entry.ttlMs)));
    },
    async deleteMany(keys: readonly K[]): Promise<boolean[]> {
      if (cache.deleteMany) return await cache.deleteMany(keys);
      return await Promise.all(keys.map((key) => cache.delete(key)));
    },
    async keys(): Promise<K[]> {
      if (cache.keys) return await cache.keys();
      throw new TypeError("asAsyncCacheAdapter: underlying cache does not support keys()");
    },
  };
}

/**
 * Prefixes every key with `namespace` + `separator` on a string-keyed cache,
 * so multiple consumers can share one backend without collisions (keyv
 * namespace convention). Keys written through the wrapper are tracked, so
 * `clear()` removes only this namespace's entries — never a sibling's.
 * Entries written to the backend out-of-band are visible to `get`/`has`
 * (if correctly prefixed) but are not covered by `clear()`/`keys()`.
 * Derived operations (`clear`, `keys`, batch ops) always return Promises.
 */
export function namespacedCacheAdapter<V = unknown>(
  cache: CacheAdapter<string, V>,
  namespace: string,
  separator = ":"
): AsyncCacheAdapter<string, V> {
  if (typeof namespace !== "string" || namespace.length === 0) {
    throw new TypeError("namespacedCacheAdapter: namespace must be a non-empty string");
  }
  const prefix = `${namespace}${separator}`;
  const tracked = new Set<string>();
  return {
    async get(key: string): Promise<V | undefined> {
      return await cache.get(prefix + key);
    },
    async set(key: string, value: V, ttlMs?: number): Promise<void> {
      await cache.set(prefix + key, value, ttlMs);
      tracked.add(key);
    },
    async delete(key: string): Promise<boolean> {
      tracked.delete(key);
      return await cache.delete(prefix + key);
    },
    async has(key: string): Promise<boolean> {
      return await cache.has(prefix + key);
    },
    async clear(): Promise<void> {
      const keys = [...tracked];
      tracked.clear();
      await Promise.all(keys.map((key) => cache.delete(prefix + key)));
    },
    async getMany(keys: readonly string[]): Promise<(V | undefined)[]> {
      const prefixed = keys.map((key) => prefix + key);
      if (cache.getMany) return await cache.getMany(prefixed);
      return await Promise.all(prefixed.map((key) => cache.get(key)));
    },
    async setMany(entries: readonly CacheEntry<string, V>[]): Promise<void> {
      const prefixed = entries.map((entry) => ({ ...entry, key: prefix + entry.key }));
      if (cache.setMany) await cache.setMany(prefixed);
      else await Promise.all(prefixed.map((e) => cache.set(e.key, e.value, e.ttlMs)));
      for (const entry of entries) tracked.add(entry.key);
    },
    async deleteMany(keys: readonly string[]): Promise<boolean[]> {
      for (const key of keys) tracked.delete(key);
      const prefixed = keys.map((key) => prefix + key);
      if (cache.deleteMany) return await cache.deleteMany(prefixed);
      return await Promise.all(prefixed.map((key) => cache.delete(key)));
    },
    async keys(): Promise<string[]> {
      const live: string[] = [];
      for (const key of tracked) {
        if (await cache.has(prefix + key)) live.push(key);
        else tracked.delete(key);
      }
      return live;
    },
  };
}
