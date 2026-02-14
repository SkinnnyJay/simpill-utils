import { VALUE_0 } from "./constants";

/**
 * Runtime guards and predicates for object values.
 * Use for type narrowing and safe checks before object operations.
 */

/** Type guard: true if value is a plain object (Object literal, not null, not Array). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/** Type guard: true if value is a non-null object (including arrays and class instances). */
export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/** Type guard: true if value is a record-like object (object with string keys). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) || (isObject(value) && !Array.isArray(value));
}

/** Returns true if value is an empty object (no own enumerable string keys). */
export function isEmptyObject(value: unknown): value is Record<string, never> {
  if (!isPlainObject(value)) {
    return false;
  }
  return Object.keys(value).length === VALUE_0;
}

/** Returns true if value is null or undefined. */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Returns true if value is defined (not null and not undefined). */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** Returns true if obj has own (non-inherited) property key. */
export function hasOwn(obj: object, key: string | number | symbol): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
