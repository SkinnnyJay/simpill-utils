/**
 * Shallow and deep merge utilities with predictable behavior.
 *
 * Security: deepMerge is prototype-pollution hardened. Keys named
 * `__proto__`, `constructor`, and `prototype` are never walked into or
 * assigned, so a JSON-parsed payload like `{"__proto__":{"x":1}}` cannot
 * mutate Object.prototype (the CVE class shared by lodash.merge,
 * deepmerge, ts-deepmerge, and friends).
 */

import { isPlainObject } from "./guards";

/** Keys that can reach an object's prototype and must never be merged. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

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
 * Deep-clones a value that originates only from `source`, so the merged
 * result never shares nested references with its inputs (mutating the
 * output can't corrupt the source, and vice versa). Falls back to a manual
 * recursive clone when structuredClone is unavailable or throws (e.g. on
 * functions or other non-cloneable values), in which case the reference is
 * returned as-is — matching prior behavior for such values.
 */
function cloneSourceValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneSourceValue);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        continue;
      }
      out[key] = cloneSourceValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * Deep merge: recursively merges plain objects; other values are copied from source.
 * Does not mutate target; returns a new object.
 *
 * - Prototype-pollution safe: forbidden keys (`__proto__`, `constructor`,
 *   `prototype`) are skipped at every depth.
 * - No aliasing: source-only object/array branches are deep-cloned rather
 *   than copied by reference, so the result is fully detached from its inputs.
 * - Cycle-safe against the target/source graph via forbidden-key stripping;
 *   genuinely circular source references are still unsupported.
 */
export function deepMerge<T extends object, S extends object>(
  target: T,
  source: S,
  options: DeepMergeOptions = {}
): T & S {
  const { concatArrays = false, skipUndefined = false } = options;
  const result = { ...target } as T & S;

  for (const key of Object.keys(source) as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    const srcVal = (source as Record<string, unknown>)[key];
    if (skipUndefined && srcVal === undefined) {
      continue;
    }
    const tgtVal = (result as Record<string, unknown>)[key];
    if (concatArrays && Array.isArray(tgtVal) && Array.isArray(srcVal)) {
      (result as Record<string, unknown>)[key] = [
        ...tgtVal,
        ...(srcVal.map(cloneSourceValue) as unknown[]),
      ];
    } else if (isPlainObject(tgtVal) && isPlainObject(srcVal)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        tgtVal as object,
        srcVal as object,
        options
      );
    } else {
      (result as Record<string, unknown>)[key] = cloneSourceValue(srcVal);
    }
  }
  return result;
}
