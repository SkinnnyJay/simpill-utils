/**
 * Shared contracts for collection types.
 * ICollection: size, isEmpty, clear, toArray, iterator.
 * IIndexable: get, set, at (for Vector/OrderedMap).
 * Equatable / Hasher for custom equality in maps/sets.
 */

/** Base collection contract: size, isEmpty, clear, toArray, iterable. */
export interface ICollection<T> {
  readonly size: number;
  isEmpty(): boolean;
  clear(): void;
  toArray(): T[];
  [Symbol.iterator](): Iterator<T>;
}

/** Indexable contract for array-like access (Vector, OrderedMap values). */
export interface IIndexable<T> {
  get(index: number): T | undefined;
  set(index: number, value: T): void;
  at(index: number): T | undefined;
}

/** Optional custom equality for keys/values (e.g. TypedSet, BiMap). */
export type Equatable<T> = (a: T, b: T) => boolean;

/** Optional custom hash for keys (e.g. Map-like structures). */
export type Hasher<T> = (value: T) => string | number;
