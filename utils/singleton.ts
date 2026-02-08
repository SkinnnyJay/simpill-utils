/**
 * Singleton Factory Utility
 *
 * Provides thread-safe singleton pattern for Next.js with hot reload support.
 * Ensures single instance per process while handling module reloads gracefully.
 *
 * IMPORTANT: This pattern accesses globalThis on EVERY call to the getter function,
 * not just at module load time. This is critical for Next.js dev mode where modules
 * may be re-evaluated in different execution contexts.
 */

/**
 * Type for global singleton storage
 */
type GlobalWithSingletons = typeof globalThis & {
  __singletons?: Map<string, unknown>;
};

/**
 * Get or create singleton storage map
 * Called on every access to ensure we always use the same globalThis storage
 */
function getSingletonStorage(): Map<string, unknown> {
  const g = globalThis as GlobalWithSingletons;
  if (!g.__singletons) {
    g.__singletons = new Map();
  }
  return g.__singletons;
}

/**
 * Create a singleton factory function
 *
 * @param factory Function that creates the instance
 * @param key Unique key for this singleton (used for storage)
 * @returns Function that returns the singleton instance
 *
 * @example
 * ```typescript
 * const getKybernetes = createSingleton(
 *   () => new Kybernetes(queue, bus),
 *   'kybernetes'
 * );
 *
 * const instance = getKybernetes(); // Always returns same instance
 * ```
 */
export function createSingleton<T>(factory: () => T, key: string): () => T {
  // NOTE: We do NOT capture storage here. We access globalThis on every call
  // to handle Next.js module re-evaluation in dev mode.

  return (): T => {
    // Access storage on EVERY call to ensure we use the same globalThis reference
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

/**
 * Reset a singleton (useful for testing)
 *
 * @param key The singleton key to reset
 */
export function resetSingleton(key: string): void {
  const storage = getSingletonStorage();
  storage.delete(key);
}

/**
 * Reset all singletons (useful for testing)
 */
export function resetAllSingletons(): void {
  const storage = getSingletonStorage();
  storage.clear();
}
