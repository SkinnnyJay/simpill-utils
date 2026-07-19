/** Cache interface for memoize: get, set, has, optional delete and clear. */
export interface MemoizeCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete?(key: K): boolean;
  clear?(): void;
}

export interface MemoizeOptions<TArgs extends unknown[], TReturn> {
  key?: (...args: TArgs) => unknown;
  /** Serialize args to string key for non-primitive args (e.g. JSON.stringify(args)). */
  keySerializer?: (...args: TArgs) => string;
  cache?: MemoizeCache<unknown, TReturn>;
}

/** Memoized function with its backing cache exposed for inspection/invalidation (lodash-style). */
export interface MemoizedFunction<TArgs extends unknown[], TReturn> {
  (...args: TArgs): TReturn;
  /** The backing cache; use cache.delete?.(key) / cache.clear?.() to invalidate. */
  cache: MemoizeCache<unknown, TReturn>;
}

/**
 * Memoize fn with optional key, keySerializer, and cache. Default cache is unbounded; pass LRUMap or bounded cache for long-lived use.
 * NOTE: the default key is the FIRST argument only — for multi-argument functions pass `keySerializer` (e.g. JSON.stringify of args) or a custom `key`.
 * The returned function exposes `.cache` for invalidation.
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options?: MemoizeOptions<TArgs, TReturn>
): MemoizedFunction<TArgs, TReturn> {
  const keySerializer = options?.keySerializer;
  const keyFn = options?.key ?? ((...a: unknown[]) => a[0]);
  const cache: MemoizeCache<unknown, TReturn> =
    options?.cache ?? (new Map() as MemoizeCache<unknown, TReturn>);

  const memoized = (...args: TArgs): TReturn => {
    const rawKey = (keyFn as (...a: TArgs) => unknown)(...args);
    const key = keySerializer ? keySerializer(...args) : rawKey;
    // Single-lookup fast path: only fall back to has() when the hit is `undefined`.
    const hit = cache.get(key);
    if (hit !== undefined || cache.has(key)) return hit as TReturn;
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
  (memoized as MemoizedFunction<TArgs, TReturn>).cache = cache;
  return memoized as MemoizedFunction<TArgs, TReturn>;
}
