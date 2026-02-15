/**
 * Minimal cache interface: get, set, delete, has.
 * Implementations can be in-memory, LRU, TTL, or remote.
 */
export interface CacheAdapter<K = string, V = unknown> {
  get(key: K): V | undefined | Promise<V | undefined>;
  set(key: K, value: V): void | Promise<void>;
  delete(key: K): boolean | Promise<boolean>;
  has(key: K): boolean | Promise<boolean>;
}

/**
 * In-memory cache adapter using a Map. Useful for tests or simple caching.
 */
export function memoryCacheAdapter<K = string, V = unknown>(): CacheAdapter<K, V> {
  const map = new Map<K, V>();
  return {
    get(key) {
      return map.get(key);
    },
    set(key, value) {
      map.set(key, value);
    },
    delete(key) {
      return map.delete(key);
    },
    has(key) {
      return map.has(key);
    },
  };
}
