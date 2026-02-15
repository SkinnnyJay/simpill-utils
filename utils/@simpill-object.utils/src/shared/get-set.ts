/**
 * Safe get/set by path (e.g. "a.b.c") with optional default and no throw.
 */

import { isPlainObject } from "./guards";

const PATH_SEP = ".";

function isRecordLike(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Get value at dot-separated path; undefined if any segment is missing.
 * For a typed result pass the return generic: getByPath<Obj, Result>(obj, path). Narrow or validate at call site.
 */
export function getByPath<T, R = unknown>(obj: T, path: string): R {
  if (path === "") {
    return obj as unknown as R;
  }
  const segments = path.split(PATH_SEP);
  let current: unknown = obj;
  for (const key of segments) {
    if (!isRecordLike(current)) {
      return undefined as R;
    }
    current = current[key];
  }
  return current as R;
}

/** Path with default when missing. Use getByPathOrDefault<Obj, Result, Default>(obj, path, default) for typed result. */
export function getByPathOrDefault<T, R = unknown, D = unknown>(
  obj: T,
  path: string,
  defaultValue: D
): R | D {
  const value = getByPath<T, R>(obj, path);
  return (value === undefined ? defaultValue : value) as R | D;
}

/** True if every path segment exists and the final key is present. */
export function hasPath(obj: unknown, path: string): boolean {
  if (path === "") {
    return true;
  }
  const segments = path.split(PATH_SEP);
  let current: unknown = obj;
  for (let i = 0; i < segments.length; i++) {
    if (!isRecordLike(current)) {
      return false;
    }
    const key = segments[i];
    if (i === segments.length - 1) {
      return key in current;
    }
    current = current[key];
  }
  return true;
}

/** Sets value at path; mutates obj, creates plain objects for missing segments. Path must not contain array indices (e.g. "a.0.b"); only dotted object keys are supported. */
export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  if (path === "") {
    return obj;
  }
  const segments = path.split(PATH_SEP);
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    let next = current[key];
    if (!isPlainObject(next)) {
      next = {};
      current[key] = next;
    }
    current = next as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
  return obj;
}
