/**
 * Helpers to make objects immutable (freeze) or non-extensible (seal) recursively.
 */

import { isPlainObject } from "./guards";

/**
 * Recursively freezes a plain object and its plain-object properties. Returns the same reference.
 */
export function deepFreeze<T>(obj: T): T {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (isPlainObject(value) || Array.isArray(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

/**
 * Recursively seals a plain object and its plain-object properties. Returns the same reference.
 */
export function deepSeal<T>(obj: T): T {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return obj;
  }
  Object.seal(obj);
  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (isPlainObject(value) || Array.isArray(value)) {
      deepSeal(value);
    }
  }
  return obj;
}
