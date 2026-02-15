import { InMemoryCache } from "./in-memory-cache.utils";
import type { MemoizeCache } from "./memoize";

export interface MemoizeAsyncOptions<TArgs extends unknown[], TReturn> {
  key?: (...args: TArgs) => unknown;
  /** Serialize args to string key for non-primitive args (e.g. JSON.stringify(args)). */
  keySerializer?: (...args: TArgs) => string;
  cache?: MemoizeCache<unknown, Promise<TReturn>>;
  ttlMs?: number;
  cacheRejected?: boolean;
}

/** Memoize async fn with optional TTL and cacheRejected. Default cache (when no ttlMs) is unbounded; pass bounded cache for long-lived use. */
export function memoizeAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: MemoizeAsyncOptions<TArgs, TReturn> = {}
): (...args: TArgs) => Promise<TReturn> {
  const keySerializer = options.keySerializer;
  const keyFn = options.key ?? ((...args: TArgs) => args[0]);
  const cache: MemoizeCache<unknown, Promise<TReturn>> = options.cache ??
  (options.ttlMs !== undefined
    ? new InMemoryCache<unknown, Promise<TReturn>>({ defaultTtlMs: options.ttlMs })
    : (new Map() as MemoizeCache<unknown, Promise<TReturn>>));
  const shouldCacheRejected = options.cacheRejected ?? false;

  return (...args: TArgs): Promise<TReturn> => {
    const rawKey = keyFn(...args);
    const key = keySerializer ? keySerializer(...args) : rawKey;
    if (cache.has(key)) {
      return cache.get(key) as Promise<TReturn>;
    }
    const promise = fn(...args);
    cache.set(key, promise);

    if (!shouldCacheRejected) {
      promise.catch(() => {
        if (cache.get(key) === promise) {
          cache.delete?.(key);
        }
      });
    }

    return promise;
  };
}
