/**
 * Re-exports from canonical packages. Implementation lives in:
 * - @simpill/function.utils (debounce, throttle, once)
 * - @simpill/async.utils (raceWithTimeout)
 * - @simpill/cache.utils (memoize)
 * - @simpill/object.utils (singleton)
 * - @simpill/uuid.utils (UUID helpers)
 * - @simpill/enum.utils (enum helpers)
 * Local: primitive-helpers (toBoolean, coalesce, assert, safe JSON).
 */

export { raceWithTimeout } from "@simpill/async.utils";
export { type MemoizeCache, memoize } from "@simpill/cache.utils";
export {
  EnumHelper,
  getEnumValue,
  isValidEnumValue,
} from "@simpill/enum.utils";
export {
  type CancellableFunction,
  debounce,
  once,
  type ThrottleOptions,
  throttle,
} from "@simpill/function.utils";
export {
  createSingleton,
  resetAllSingletons,
  resetSingleton,
} from "@simpill/object.utils";
export {
  compareUUIDs,
  generateUUID,
  isUUID,
  validateUUID,
} from "@simpill/uuid.utils";
export {
  assert,
  coalesce,
  identity,
  isBoolean,
  parseJsonSafe,
  type ToBooleanOptions,
  toBoolean,
  toggle,
  toJsonSafe,
} from "./primitive-helpers";
