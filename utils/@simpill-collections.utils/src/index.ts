/**
 * @simpill/collections.utils – Data structures and collection types.
 * @see @simpill/collections.utils/client
 * @see @simpill/collections.utils/server
 * @see @simpill/collections.utils/shared
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
} from "./shared";
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
} from "./shared";
