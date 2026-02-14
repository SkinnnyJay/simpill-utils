/**
 * Safe get/set by path (e.g. "a.b.c") with optional default and no throw.
 */

import { isPlainObject } from "./guards";

const PATH_SEP = ".";

function isRecordLike(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Dot-separated path; undefined if any segment is missing. Narrow or assert at call site. */
export function getByPath<T>(obj: T, path: string): unknown {
  if (path === "") {
    return obj;
  }
  const segments = path.split(PATH_SEP);
  let current: unknown = obj;
  for (const key of segments) {
    if (!isRecordLike(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/** Path with default when missing. */
export function getByPathOrDefault<T, D>(obj: T, path: string, defaultValue: D): unknown | D {
  const value = getByPath(obj, path);
  return value === undefined ? defaultValue : value;
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
