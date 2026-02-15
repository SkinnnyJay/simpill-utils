/**
 * Singleton factory utility.
 * Ensures a single instance per key using globalThis storage (works with Next.js hot reload).
 */

type GlobalWithSingletons = typeof globalThis & {
  __singletons?: Map<string, unknown>;
};

function getSingletonStorage(): Map<string, unknown> {
  const g = globalThis as GlobalWithSingletons;
  if (!g.__singletons) {
    g.__singletons = new Map();
  }
  return g.__singletons;
}

/**
 * Create a singleton getter that returns the same instance for a given key.
 * Storage is read from globalThis on every call to support Next.js module re-evaluation.
 *
 * @param factory - Creates the instance when first needed
 * @param key - Unique key for this singleton
 * @returns Getter that returns the singleton instance
 */
export function createSingleton<T>(factory: () => T, key: string): () => T {
  return (): T => {
    const storage = getSingletonStorage();
    const existing = storage.get(key);
    if (existing !== undefined) {
      return existing as T;
    }
    const instance = factory();
    storage.set(key, instance);
    return instance;
  };
}

/** Remove one singleton by key (e.g. for tests). */
export function resetSingleton(key: string): void {
  getSingletonStorage().delete(key);
}

/** Remove all singletons (e.g. for tests). */
export function resetAllSingletons(): void {
  getSingletonStorage().clear();
}
