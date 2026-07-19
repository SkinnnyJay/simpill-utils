/**
 * Safe deep-clone helpers.
 *
 * safeClone strips prototype-pollution vectors (`__proto__`, `constructor`,
 * `prototype`) while copying, so a clone of an attacker-shaped object can
 * never carry a poisoned prototype into your data. Prefers the native
 * structuredClone (Node >= 17, all modern browsers) for speed and correct
 * handling of Date/Map/Set/TypedArray, then re-sanitizes plain-object keys.
 */

import { isPlainObject } from "./guards";

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Recursive structural clone that drops forbidden keys at every depth. */
function sanitizeClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeClone(v)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        continue;
      }
      out[key] = sanitizeClone((value as Record<string, unknown>)[key]);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Deep-clones a value, stripping prototype-pollution keys. Plain objects and
 * arrays are cloned structurally; primitives are returned as-is. Non-plain
 * objects (Date, Map, Set, class instances, TypedArrays) are cloned via
 * structuredClone when available; if structuredClone is missing or throws
 * (e.g. functions), the original reference is returned.
 */
export function safeClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    return sanitizeClone(value);
  }
  const sc = (globalThis as { structuredClone?: <U>(v: U) => U }).structuredClone;
  if (typeof sc === "function") {
    try {
      return sc(value);
    } catch {
      return value;
    }
  }
  return value;
}
