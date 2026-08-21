/** Typed metadata store keyed by symbol or string; use for attaching annotations. */
export type MetadataKey = symbol | string;

export interface MetadataStore {
  get<T>(key: MetadataKey): T | undefined;
  set<T>(key: MetadataKey, value: T): void;
  has(key: MetadataKey): boolean;
  delete(key: MetadataKey): boolean;
}

/** Creates a new metadata store (plain Map); use symbol keys for private annotations. */
export function createMetadataStore(): MetadataStore {
  const map = new Map<MetadataKey, unknown>();
  return {
    get<T>(key: MetadataKey): T | undefined {
      return map.get(key) as T | undefined;
    },
    set<T>(key: MetadataKey, value: T): void {
      map.set(key, value);
    },
    has(key: MetadataKey): boolean {
      return map.has(key);
    },
    delete(key: MetadataKey): boolean {
      return map.delete(key);
    },
  };
}

/** Global metadata store for process/module-level annotations; prefer createMetadataStore() for scoped stores. */
export const globalMetadataStore: MetadataStore = createMetadataStore();

/**
 * Get metadata for a key from the given store (or global if not provided).
 */
export function getMetadata<T>(key: MetadataKey, store?: MetadataStore): T | undefined {
  const s = store ?? globalMetadataStore;
  return s.get<T>(key);
}

/** Set metadata for a key on the given store (or global if not provided). */
export function setMetadata<T>(key: MetadataKey, value: T, store?: MetadataStore): void {
  const s = store ?? globalMetadataStore;
  s.set(key, value);
}
