const INSTANCE_KEY = Symbol.for("@simpill/factories.utils.singleton");

/** Boxed so a factory that legitimately returns `undefined` is still cached (built once). */
type InstanceBox<T> = { value: T };

type GetterWithInstance<T> = (() => T) & { [INSTANCE_KEY]?: InstanceBox<T> };
type AsyncGetterWithInstance<T> = (() => Promise<T>) & {
  [INSTANCE_KEY]?: InstanceBox<Promise<T>>;
};

/**
 * Getter that lazily builds and caches a single instance of T (factory invoked on
 * first access). A throwing factory is NOT cached — the next get() retries. A
 * factory that (directly or transitively) calls its own getter throws instead of
 * recursing forever.
 */
export function singletonFactory<T>(factory: () => T): () => T {
  let creating = false;
  const getter = (): T => {
    const g = getter as GetterWithInstance<T>;
    const box = g[INSTANCE_KEY];
    if (box !== undefined) {
      return box.value;
    }
    if (creating) {
      throw new Error(
        "singletonFactory: circular initialization — the factory called its own getter"
      );
    }
    creating = true;
    try {
      const value = factory();
      g[INSTANCE_KEY] = { value };
      return value;
    } finally {
      creating = false;
    }
  };
  return getter;
}

/**
 * Async twin of singletonFactory: getter that lazily runs the (async or sync)
 * factory once and caches the shared promise, so concurrent first callers all
 * await the SAME in-flight initialization. A rejected initialization is evicted
 * from the cache — the next get() retries instead of replaying the cached
 * rejection forever (the classic async-singleton pitfall). Resettable with
 * resetSingletonFactory.
 */
export function singletonAsyncFactory<T>(factory: () => Promise<T> | T): () => Promise<T> {
  const getter = (): Promise<T> => {
    const g = getter as AsyncGetterWithInstance<T>;
    const box = g[INSTANCE_KEY];
    if (box !== undefined) {
      return box.value;
    }
    // Invoke synchronously (first caller kicks off initialization immediately);
    // a synchronously-throwing factory still surfaces as a rejection, never a throw.
    let initial: Promise<T>;
    try {
      initial = Promise.resolve(factory());
    } catch (error) {
      initial = Promise.reject(error);
    }
    const promise: Promise<T> = initial.catch((error: unknown) => {
      // Evict only if this promise is still the cached one (a reset +
      // re-initialization may have replaced it while we were in flight).
      if (g[INSTANCE_KEY]?.value === promise) {
        g[INSTANCE_KEY] = undefined;
      }
      throw error;
    });
    g[INSTANCE_KEY] = { value: promise };
    return promise;
  };
  return getter;
}

/**
 * Resets the singleton so the next get() invokes the factory again; only for
 * getters from singletonFactory / singletonAsyncFactory.
 */
export function resetSingletonFactory(getter: () => unknown): void {
  const g = getter as GetterWithInstance<unknown>;
  if (INSTANCE_KEY in g) {
    g[INSTANCE_KEY] = undefined;
  }
}
