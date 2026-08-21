/**
 * TC39 decorator metadata (Symbol.metadata) interop.
 *
 * TypeScript 5.2+ implements the TC39 Decorator Metadata proposal: standard
 * decorators receive context.metadata, and the finished object is exposed on
 * the class via Symbol.metadata. Subclass metadata objects have the parent's
 * metadata object as their prototype, so plain property reads inherit.
 *
 * These helpers bridge that standard to this package's MetadataStore API
 * without requiring reflect-metadata, decorator syntax, or tsconfig changes.
 * Importing this module has NO side effects (Symbol is never mutated unless
 * ensureSymbolMetadata() is explicitly called).
 */
import type { MetadataKey, MetadataStore, TypedMetadataKey } from "./metadata-store";

type AnyMetadataKey = MetadataKey | TypedMetadataKey<unknown>;

/** The shape of context.metadata / Class[Symbol.metadata] per the TC39 proposal. */
export type DecoratorMetadataObject = Record<PropertyKey, unknown> & object;

/**
 * Resolves the Symbol.metadata well-known symbol. Falls back to the
 * cross-realm registry symbol Symbol.for("Symbol.metadata") — the polyfill
 * convention used by TypeScript's emitted code and Babel — so metadata
 * written by polyfilled environments is still found.
 */
export function symbolMetadata(): symbol {
  return (Symbol as { metadata?: symbol }).metadata ?? Symbol.for("Symbol.metadata");
}

/**
 * Installs Symbol.metadata (as Symbol.for("Symbol.metadata")) if the runtime
 * lacks it, and returns it. Explicit opt-in polyfill — call once at app
 * startup before evaluating decorated classes on runtimes without native
 * Symbol.metadata. Idempotent; never overwrites a native implementation.
 */
export function ensureSymbolMetadata(): symbol {
  const s = Symbol as { metadata?: symbol };
  if (s.metadata === undefined) {
    Object.defineProperty(Symbol, "metadata", {
      value: Symbol.for("Symbol.metadata"),
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
  return (Symbol as { metadata?: symbol }).metadata as symbol;
}

/**
 * Reads the decorator metadata object from a class (own or inherited from a
 * decorated base class). Returns undefined when the class has none.
 */
export function getDecoratorMetadata(
  cls: abstract new (...args: never[]) => unknown,
): DecoratorMetadataObject | undefined {
  const value = (cls as unknown as Record<symbol, unknown>)[symbolMetadata()];
  return typeof value === "object" && value !== null
    ? (value as DecoratorMetadataObject)
    : undefined;
}

/**
 * Reads a single value from a class's decorator metadata. Inherits from
 * decorated base classes via the metadata object's prototype chain, per the
 * TC39 proposal's semantics.
 */
export function readDecoratorMetadata<T>(
  cls: abstract new (...args: never[]) => unknown,
  key: TypedMetadataKey<T>,
): T | undefined;
export function readDecoratorMetadata<T>(
  cls: abstract new (...args: never[]) => unknown,
  key: MetadataKey,
): T | undefined;
export function readDecoratorMetadata<T>(
  cls: abstract new (...args: never[]) => unknown,
  key: AnyMetadataKey,
): T | undefined {
  const metadata = getDecoratorMetadata(cls);
  return metadata === undefined ? undefined : (metadata[key as MetadataKey] as T | undefined);
}

/**
 * Wraps a TC39 decorator metadata object (context.metadata inside a
 * decorator, or Class[Symbol.metadata] afterwards) in this package's
 * MetadataStore interface, so decorator code and store code share one API.
 *
 * Semantics follow the underlying plain object per the proposal:
 * - get/has see inherited entries (prototype chain of the metadata object);
 * - set/delete affect own entries only;
 * - size/keys/values/entries/iteration enumerate OWN entries only.
 */
export function metadataStoreFromDecorator(metadata: DecoratorMetadataObject): MetadataStore {
  const ownKeys = (): MetadataKey[] =>
    Reflect.ownKeys(metadata).filter(
      (k): k is MetadataKey => typeof k === "string" || typeof k === "symbol",
    );
  return {
    get<T>(key: AnyMetadataKey): T | undefined {
      return metadata[key as MetadataKey] as T | undefined;
    },
    set<T>(key: AnyMetadataKey, value: T): void {
      metadata[key as MetadataKey] = value;
    },
    has(key: AnyMetadataKey): boolean {
      return (key as MetadataKey) in metadata;
    },
    delete(key: AnyMetadataKey): boolean {
      const k = key as MetadataKey;
      if (Object.getOwnPropertyDescriptor(metadata, k) === undefined) {
        return false;
      }
      delete metadata[k];
      return true;
    },
    getOrSet<T>(key: AnyMetadataKey, factory: () => T): T {
      const k = key as MetadataKey;
      if (k in metadata) {
        return metadata[k] as T;
      }
      const value = factory();
      metadata[k] = value;
      return value;
    },
    clear(): void {
      for (const k of ownKeys()) {
        delete metadata[k];
      }
    },
    get size(): number {
      return ownKeys().length;
    },
    keys(): IterableIterator<MetadataKey> {
      return ownKeys()[Symbol.iterator]();
    },
    values(): IterableIterator<unknown> {
      return ownKeys()
        .map((k) => metadata[k])
        [Symbol.iterator]();
    },
    entries(): IterableIterator<[MetadataKey, unknown]> {
      return ownKeys()
        .map((k): [MetadataKey, unknown] => [k, metadata[k]])
        [Symbol.iterator]();
    },
    [Symbol.iterator](): IterableIterator<[MetadataKey, unknown]> {
      return this.entries();
    },
  };
}
