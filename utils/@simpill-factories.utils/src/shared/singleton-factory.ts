const INSTANCE_KEY = Symbol.for("@simpill/factories.utils.singleton");

type GetterWithInstance<T> = (() => T) & { [INSTANCE_KEY]?: T };

/** Getter that lazily builds and caches a single instance of T (factory invoked on first access). */
export function singletonFactory<T>(factory: () => T): () => T {
  const getter = (): T => {
    const g = getter as GetterWithInstance<T>;
    if (g[INSTANCE_KEY] === undefined) {
      g[INSTANCE_KEY] = factory();
    }
    return g[INSTANCE_KEY] as T;
  };
  return getter;
}

/** Resets the singleton so the next get() invokes the factory again; only for getters from singletonFactory. */
export function resetSingletonFactory(getter: () => unknown): void {
  const g = getter as GetterWithInstance<unknown>;
  if (INSTANCE_KEY in g) {
    g[INSTANCE_KEY] = undefined;
  }
}
