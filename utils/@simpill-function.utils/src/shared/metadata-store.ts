/** Typed metadata store keyed by symbol or string; use for attaching annotations. */
export type MetadataKey = symbol | string;

declare const metadataValueType: unique symbol;

/**
 * A metadata key that carries its value type. Created via createMetadataKey<T>().
 * At runtime this is a plain symbol; the phantom type parameter makes
 * store.get/set infer and enforce T without runtime cost or assertions.
 */
export interface TypedMetadataKey<T> {
  readonly description?: string;
  /** Phantom type marker — never present at runtime. */
  readonly [metadataValueType]?: T;
}

/** Creates a symbol-backed metadata key that carries its value type T. */
export function createMetadataKey<T>(description?: string): TypedMetadataKey<T> {
  return Symbol(description) as unknown as TypedMetadataKey<T>;
}

/** Internal: any key accepted by store operations. */
type AnyMetadataKey = MetadataKey | TypedMetadataKey<unknown>;

export interface MetadataStore {
  get<T>(key: TypedMetadataKey<T>): T | undefined;
  get<T>(key: MetadataKey): T | undefined;
  set<T>(key: TypedMetadataKey<T>, value: T): void;
  set<T>(key: MetadataKey, value: T): void;
  has(key: AnyMetadataKey): boolean;
  delete(key: AnyMetadataKey): boolean;
  /** Returns the existing value for key, or stores and returns factory(). */
  getOrSet<T>(key: TypedMetadataKey<T>, factory: () => T): T;
  getOrSet<T>(key: MetadataKey, factory: () => T): T;
  /** Removes all entries. */
  clear(): void;
  /** Number of entries in the store. */
  readonly size: number;
  keys(): IterableIterator<MetadataKey>;
  values(): IterableIterator<unknown>;
  entries(): IterableIterator<[MetadataKey, unknown]>;
  [Symbol.iterator](): IterableIterator<[MetadataKey, unknown]>;
}

class MapMetadataStore implements MetadataStore {
  private readonly map: Map<MetadataKey, unknown>;

  constructor(entries?: Iterable<readonly [MetadataKey, unknown]>) {
    this.map = new Map<MetadataKey, unknown>(entries);
  }

  get<T>(key: AnyMetadataKey): T | undefined {
    return this.map.get(key as MetadataKey) as T | undefined;
  }

  set<T>(key: AnyMetadataKey, value: T): void {
    this.map.set(key as MetadataKey, value);
  }

  has(key: AnyMetadataKey): boolean {
    return this.map.has(key as MetadataKey);
  }

  delete(key: AnyMetadataKey): boolean {
    return this.map.delete(key as MetadataKey);
  }

  getOrSet<T>(key: AnyMetadataKey, factory: () => T): T {
    const k = key as MetadataKey;
    if (this.map.has(k)) {
      return this.map.get(k) as T;
    }
    const value = factory();
    this.map.set(k, value);
    return value;
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  keys(): IterableIterator<MetadataKey> {
    return this.map.keys();
  }

  values(): IterableIterator<unknown> {
    return this.map.values();
  }

  entries(): IterableIterator<[MetadataKey, unknown]> {
    return this.map.entries();
  }

  [Symbol.iterator](): IterableIterator<[MetadataKey, unknown]> {
    return this.map.entries();
  }
}

/**
 * Creates a new metadata store (plain Map); use symbol keys for private annotations.
 * Optionally seeds the store from an iterable of entries (e.g. another store's
 * entries() for a snapshot/copy).
 */
export function createMetadataStore(
  entries?: Iterable<readonly [MetadataKey, unknown]>,
): MetadataStore {
  return new MapMetadataStore(entries);
}

/**
 * Global metadata store for process/module-level annotations; prefer
 * createMetadataStore() for scoped stores.
 *
 * Registered under a Symbol.for() key on globalThis so that duplicate copies
 * of this package (npm dedup failures, mixed ESM/CJS graphs) share ONE store
 * instead of silently splitting "global" state per copy.
 */
const GLOBAL_STORE_KEY = Symbol.for("@simpill/function.utils:global-metadata-store");

const globalRegistry = globalThis as unknown as Record<symbol, unknown>;

function resolveGlobalStore(): MetadataStore {
  const existing = globalRegistry[GLOBAL_STORE_KEY] as MetadataStore | undefined;
  if (existing !== undefined) {
    return existing;
  }
  const created = createMetadataStore();
  globalRegistry[GLOBAL_STORE_KEY] = created;
  return created;
}

export const globalMetadataStore: MetadataStore = resolveGlobalStore();

/**
 * Get metadata for a key from the given store (or global if not provided).
 */
export function getMetadata<T>(key: TypedMetadataKey<T>, store?: MetadataStore): T | undefined;
export function getMetadata<T>(key: MetadataKey, store?: MetadataStore): T | undefined;
export function getMetadata<T>(key: AnyMetadataKey, store?: MetadataStore): T | undefined {
  const s = store ?? globalMetadataStore;
  return s.get<T>(key as MetadataKey);
}

/** Set metadata for a key on the given store (or global if not provided). */
export function setMetadata<T>(key: TypedMetadataKey<T>, value: T, store?: MetadataStore): void;
export function setMetadata<T>(key: MetadataKey, value: T, store?: MetadataStore): void;
export function setMetadata<T>(key: AnyMetadataKey, value: T, store?: MetadataStore): void {
  const s = store ?? globalMetadataStore;
  s.set(key as MetadataKey, value);
}
