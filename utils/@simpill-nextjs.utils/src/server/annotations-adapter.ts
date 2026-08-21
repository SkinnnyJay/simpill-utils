import type { IAnnotations } from "../shared/interfaces";

/** No-op annotations when no store is provided. */
export function createNoopAnnotations(): IAnnotations {
  return {
    getMetadata(): undefined {
      return undefined;
    },
    setMetadata(): void {},
  };
}

/**
 * Creates IAnnotations from a store with get/set (e.g. annotations.utils).
 * The IAnnotations interface always declared an optional `target` — the previous
 * implementation silently DROPPED it, so per-target metadata collided in the
 * global store. Targets are now honored via a GC-safe WeakMap side table
 * (reads are allocation-free: looking up an un-annotated target inserts nothing).
 */
export function createAnnotationsAdapter(store: {
  get<T>(key: symbol | string): T | undefined;
  set(key: symbol | string, value: unknown): void;
}): IAnnotations {
  const perTarget = new WeakMap<object, Map<symbol | string, unknown>>();

  return {
    getMetadata<T>(key: symbol | string, target?: object): T | undefined {
      if (target !== undefined) {
        return perTarget.get(target)?.get(key) as T | undefined;
      }
      return store.get(key) as T | undefined;
    },
    setMetadata(key: symbol | string, value: unknown, target?: object): void {
      if (target !== undefined) {
        let map = perTarget.get(target);
        if (map === undefined) {
          map = new Map();
          perTarget.set(target, map);
        }
        map.set(key, value);
        return;
      }
      store.set(key, value);
    },
  };
}
