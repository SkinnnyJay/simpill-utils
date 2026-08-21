import { ERROR_SWR_CUSTOM_CACHE, ERROR_SWR_REQUIRES_TTL } from "./constants";
import { InMemoryCache } from "./in-memory-cache.utils";
import type { MemoizeCache } from "./memoize";

export interface MemoizeAsyncOptions<TArgs extends unknown[], TReturn> {
  key?: (...args: TArgs) => unknown;
  /** Serialize args to string key for non-primitive args (e.g. JSON.stringify(args)). */
  keySerializer?: (...args: TArgs) => string;
  cache?: MemoizeCache<unknown, Promise<TReturn>>;
  ttlMs?: number;
  cacheRejected?: boolean;
  /**
   * Stale-while-revalidate window (ms) after ttlMs expires. Within the window a call
   * returns the stale value immediately and kicks off a single background refresh
   * (single-flight; concurrent stale hits share one refresh). If the refresh rejects,
   * the stale value is kept for the remainder of the window (stale-if-error).
   * Requires ttlMs; not compatible with a custom `cache`.
   */
  staleWhileRevalidateMs?: number;
}

interface SwrEntry<TReturn> {
  promise: Promise<TReturn>;
  /** Fresh until this timestamp (ms epoch). */
  freshUntil: number;
  /** Servable-stale until this timestamp (ms epoch). */
  staleUntil: number;
  refreshing: boolean;
}

/** Memoize async fn with optional TTL, cacheRejected, and stale-while-revalidate. Default cache (when no ttlMs) is unbounded; pass bounded cache for long-lived use. Concurrent calls with the same key share one in-flight promise (single-flight). */
export function memoizeAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: MemoizeAsyncOptions<TArgs, TReturn> = {}
): (...args: TArgs) => Promise<TReturn> {
  const keySerializer = options.keySerializer;
  const keyFn = options.key ?? ((...args: TArgs) => args[0]);
  const shouldCacheRejected = options.cacheRejected ?? false;
  const swrMs = options.staleWhileRevalidateMs;

  if (swrMs !== undefined) {
    if (options.ttlMs === undefined) throw new Error(ERROR_SWR_REQUIRES_TTL);
    if (options.cache !== undefined) throw new Error(ERROR_SWR_CUSTOM_CACHE);
    const ttlMs = options.ttlMs;
    const store = new Map<unknown, SwrEntry<TReturn>>();

    const startFetch = (key: unknown, args: TArgs): Promise<TReturn> => {
      const promise = fn(...args);
      const now = Date.now();
      const entry: SwrEntry<TReturn> = {
        promise,
        freshUntil: now + ttlMs,
        staleUntil: now + ttlMs + swrMs,
        refreshing: false,
      };
      store.set(key, entry);
      if (!shouldCacheRejected) {
        promise.catch(() => {
          if (store.get(key) === entry) store.delete(key);
        });
      }
      return promise;
    };

    const backgroundRefresh = (key: unknown, stale: SwrEntry<TReturn>, args: TArgs): void => {
      stale.refreshing = true;
      const promise = fn(...args);
      promise.then(
        () => {
          // Success: replace with a fresh entry (new windows from settle time).
          const now = Date.now();
          store.set(key, {
            promise,
            freshUntil: now + ttlMs,
            staleUntil: now + ttlMs + swrMs,
            refreshing: false,
          });
        },
        () => {
          // stale-if-error: keep serving the stale value for the rest of its window.
          stale.refreshing = false;
        }
      );
    };

    return (...args: TArgs): Promise<TReturn> => {
      const rawKey = keyFn(...args);
      const key = keySerializer ? keySerializer(...args) : rawKey;
      const entry = store.get(key);
      const now = Date.now();
      if (entry) {
        if (now <= entry.freshUntil) return entry.promise;
        if (now <= entry.staleUntil) {
          if (!entry.refreshing) backgroundRefresh(key, entry, args);
          return entry.promise;
        }
        store.delete(key);
      }
      return startFetch(key, args);
    };
  }

  const cache: MemoizeCache<unknown, Promise<TReturn>> = options.cache ??
  (options.ttlMs !== undefined
    ? new InMemoryCache<unknown, Promise<TReturn>>({ defaultTtlMs: options.ttlMs })
    : (new Map() as MemoizeCache<unknown, Promise<TReturn>>));

  return (...args: TArgs): Promise<TReturn> => {
    const rawKey = keyFn(...args);
    const key = keySerializer ? keySerializer(...args) : rawKey;
    // Single-lookup fast path (promises are never `undefined`, so a hit is definitive).
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
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
