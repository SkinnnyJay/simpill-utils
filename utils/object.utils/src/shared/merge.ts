/**
 * Shallow and deep merge utilities with predictable behavior.
 */

import { isPlainObject } from "./guards";

/** Options for deep merge. */
export interface DeepMergeOptions {
  /** If true, arrays are concatenated; otherwise source overwrites target. Default false. */
  concatArrays?: boolean;
  /** If true, undefined in source does not overwrite target. Default false. */
  skipUndefined?: boolean;
}

/**
 * Shallow merge: source's own enumerable properties override target's. Returns a new object.
 */
export function shallowMerge<T extends object, S extends object>(target: T, source: S): T & S {
  return { ...target, ...source };
}

/**
 * Deep merge: recursively merges plain objects; other values are copied from source.
 * Does not mutate target; returns a new object. No cycle detection—do not pass circular references.
 */
export function deepMerge<T extends object, S extends object>(
  target: T,
  source: S,
  options: DeepMergeOptions = {}
): T & S {
  const { concatArrays = false, skipUndefined = false } = options;
  const result = { ...target } as T & S;

  for (const key of Object.keys(source) as (keyof S)[]) {
    const srcVal = source[key];
    if (skipUndefined && srcVal === undefined) {
      continue;
    }
    const tgtVal = (result as S)[key];
    if (concatArrays && Array.isArray(tgtVal) && Array.isArray(srcVal)) {
      (result as Record<string, unknown>)[key as string] = [...tgtVal, ...srcVal];
    } else if (isPlainObject(tgtVal) && isPlainObject(srcVal)) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        tgtVal as object,
        srcVal as object,
        options
      );
    } else {
      (result as Record<string, unknown>)[key as string] = srcVal;
    }
  }
  return result;
}
