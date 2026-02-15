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

/** Creates IAnnotations from a store with get/set (e.g. annotations.utils). */
export function createAnnotationsAdapter(store: {
  get<T>(key: symbol | string): T | undefined;
  set(key: symbol | string, value: unknown): void;
}): IAnnotations {
  return {
    getMetadata<T>(key: symbol | string): T | undefined {
      return store.get(key) as T | undefined;
    },
    setMetadata(key: symbol | string, value: unknown): void {
      store.set(key, value);
    },
  };
}
