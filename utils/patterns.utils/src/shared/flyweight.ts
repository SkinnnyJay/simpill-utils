/** Factory that caches instances by key (get, clear, size). */
export type FlyweightFactory<K, V> = {
  get: (key: K) => V;
  clear: () => void;
  size: () => number;
};

/** Share instances by key; same key returns same instance (get, clear, size). */
export function createFlyweightFactory<K, V>(
  keyToId: (key: K) => string,
  create: (key: K) => V
): FlyweightFactory<K, V> {
  const cache = new Map<string, V>();

  return {
    get: (key) => {
      const id = keyToId(key);
      const cached = cache.get(id);
      if (cached) return cached;
      const value = create(key);
      cache.set(id, value);
      return value;
    },
    clear: () => {
      cache.clear();
    },
    size: () => cache.size,
  };
}
