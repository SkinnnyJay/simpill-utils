/**
 * Client/Edge exports: shared utilities only (no server-only code).
 * Re-exports from canonical packages via shared.
 */

export type {
  CancellableFunction,
  MemoizeCache,
  ThrottleOptions,
  ToBooleanOptions,
} from "../shared";
export {
  assert,
  assertDefined,
  assertNever,
  coalesce,
  compareUUIDs,
  createSingleton,
  debounce,
  EnumHelper,
  generateUUID,
  getEnumValue,
  identity,
  isBoolean,
  isDefined,
  isUUID,
  isValidEnumValue,
  memoize,
  noop,
  once,
  parseJsonSafe,
  raceWithTimeout,
  resetAllSingletons,
  resetSingleton,
  throttle,
  toBoolean,
  toggle,
  toJsonSafe,
  validateUUID,
} from "../shared";
