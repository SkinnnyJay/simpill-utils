/** Cache interface for memoize: get, set, has, optional delete. */
export interface MemoizeCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete?(key: K): boolean;
}

export interface MemoizeOptions<TArgs extends unknown[], TReturn> {
  key?: (...args: TArgs) => unknown;
  /** Serialize args to string key for non-primitive args (e.g. JSON.stringify(args)). */
  keySerializer?: (...args: TArgs) => string;
  cache?: MemoizeCache<unknown, TReturn>;
}

/** Memoize fn with optional key, keySerializer, and cache. Default cache is unbounded; pass LRUMap or bounded cache for long-lived use. */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options?: MemoizeOptions<TArgs, TReturn>
): (...args: TArgs) => TReturn {
  const keySerializer = options?.keySerializer;
  const keyFn = options?.key ?? ((...a: unknown[]) => a[0]);
  const cache: MemoizeCache<unknown, TReturn> =
    options?.cache ?? (new Map() as MemoizeCache<unknown, TReturn>);

  return (...args: TArgs): TReturn => {
    const rawKey = (keyFn as (...a: TArgs) => unknown)(...args);
    const key = keySerializer ? keySerializer(...args) : rawKey;
    if (cache.has(key)) return cache.get(key) as TReturn;
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
}
