/**
 * @simpill/object.utils – Object-related TypeScript patterns and helper methods.
 * @see @simpill/object.utils/client – Client/Edge
 * @see @simpill/object.utils/server – Server/Node.js
 * @see @simpill/object.utils/shared – Shared utilities only
 */

export type {
  BoundedArrayLogger,
  BoundedArrayOptions,
  BoundedArrayStats,
  BoundedLRUMapLogger,
  BoundedLRUMapOptions,
  BoundedLRUMapStats,
  DeepMergeOptions,
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  Entries,
  KeysOfType,
  Mutable,
  NonStringKeys,
  PartialBy,
  PathValue,
  ReadonlyShallow,
  RecordWithKnownKeys,
  RequiredBy,
  StrictRecord,
  StringKeys,
  ValueOf,
} from "./shared";
export {
  BoundedArray,
  BoundedLRUMap,
  createSingleton,
  createWithDefaults,
  deepFreeze,
  deepMerge,
  deepSeal,
  defineReadOnly,
  fromEntries,
  getByPath,
  getByPathOrDefault,
  hasPath,
  hasOwn,
  isDefined,
  isEmptyObject,
  isNil,
  isObject,
  isPlainObject,
  isRecord,
  omit,
  pick,
  pickOne,
  resetAllSingletons,
  resetSingleton,
  setByPath,
  shallowMerge,
} from "./shared";
