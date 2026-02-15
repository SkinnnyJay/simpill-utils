/**
 * Client/Edge exports for @simpill/collections.utils.
 * Re-exports shared (runtime-agnostic) collections.
 */

export type {
  BiMapOptions,
  Equatable,
  Hasher,
  ICollection,
  IIndexable,
  LRUCacheOptions,
  TTLCacheOptions,
  TypedSetOptions,
} from "../shared";
export {
  BiMap,
  CircularBuffer,
  Deque,
  LinkedList,
  LRUCache,
  MultiMap,
  OrderedMap,
  Queue,
  Stack,
  TTLCache,
  TypedSet,
  Vector,
} from "../shared";
