/**
 * Safe get/set/has/delete by path (e.g. "a.b.c" or "a[0].b") with optional
 * default and no throw.
 *
 * Paths accept either a dot/bracket string ("users[0].name") or an explicit
 * array of segments (["users", "0", "name"]). setByPath is
 * prototype-pollution hardened: segments named `__proto__`, `constructor`,
 * and `prototype` are rejected, so an attacker-controlled path such as
 * "__proto__.polluted" can never mutate Object.prototype (the classic
 * path-assignment CVE class: theFn(object, path, value)).
 */

/** Path can be a dot/bracket string or an explicit segment array. */
export type PropertyPath = string | ReadonlyArray<string | number>;

const PATH_SEP = ".";

/** Keys that reach an object's prototype and must never be written through. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isRecordLike(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** True if a segment addresses an array index (non-negative integer string). */
function isIndexKey(key: string): boolean {
  return /^(0|[1-9]\d*)$/.test(key);
}

/**
 * Normalizes a path into string segments. String paths support dot notation
 * and bracket notation, including quoted keys: a["b.c"][0] -> ["a","b.c","0"].
 * Array paths are coerced element-wise to strings.
 */
export function toPathSegments(path: PropertyPath): string[] {
  if (Array.isArray(path)) {
    return path.map((p) => String(p));
  }
  const str = path as string;
  if (str === "") {
    return [];
  }
  // Fast path: no bracket notation -> plain dot split (hot path, ~4x faster
  // than the tokenizer and identical output for dotted keys).
  if (str.indexOf("[") === -1) {
    return str.split(PATH_SEP);
  }
  const segments: string[] = [];
  const re = /\[(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^\]]*))\]|([^.[\]]+)/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard tokenizer loop
  while ((match = re.exec(str)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1].replace(/\\(.)/g, "$1"));
    } else if (match[2] !== undefined) {
      segments.push(match[2].replace(/\\(.)/g, "$1"));
    } else if (match[3] !== undefined) {
      segments.push(match[3]);
    } else if (match[4] !== undefined) {
      segments.push(match[4]);
    }
  }
  return segments;
}

/**
 * Get value at path; undefined if any segment is missing.
 * Supports dot, bracket, and array-index paths ("users[0].name").
 * For a typed result pass the return generic: getByPath<Obj, Result>(obj, path). Narrow or validate at call site.
 */
export function getByPath<T, R = unknown>(obj: T, path: PropertyPath): R {
  const segments = toPathSegments(path);
  if (segments.length === 0) {
    return obj as unknown as R;
  }
  let current: unknown = obj;
  for (const key of segments) {
    if (current == null) {
      return undefined as R;
    }
    if (isRecordLike(current) || typeof current === "string") {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined as R;
    }
  }
  return current as R;
}

/** Path with default when missing. Use getByPathOrDefault<Obj, Result, Default>(obj, path, default) for typed result. */
export function getByPathOrDefault<T, R = unknown, D = unknown>(
  obj: T,
  path: PropertyPath,
  defaultValue: D
): R | D {
  const value = getByPath<T, R>(obj, path);
  return (value === undefined ? defaultValue : value) as R | D;
}

/** True if every path segment exists and the final key is present. */
export function hasPath(obj: unknown, path: PropertyPath): boolean {
  const segments = toPathSegments(path);
  if (segments.length === 0) {
    return true;
  }
  let current: unknown = obj;
  for (let i = 0; i < segments.length; i++) {
    if (!isRecordLike(current)) {
      return false;
    }
    const key = segments[i];
    if (i === segments.length - 1) {
      return key in current || Object.hasOwn(current, key);
    }
    current = (current as Record<string, unknown>)[key];
  }
  return true;
}

/**
 * Sets value at path; mutates obj, creating intermediate containers for
 * missing segments. A missing intermediate becomes an array when the NEXT
 * segment is a non-negative integer index (matching lodash.set), otherwise
 * a plain object. Prototype-pollution safe: forbidden segments throw.
 *
 * @throws {Error} if any segment is `__proto__`, `constructor`, or `prototype`.
 */
export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: PropertyPath,
  value: unknown
): T {
  const segments = toPathSegments(path);
  if (segments.length === 0) {
    return obj;
  }
  for (const seg of segments) {
    if (FORBIDDEN_KEYS.has(seg)) {
      throw new Error(`setByPath: forbidden path segment "${seg}" (prototype pollution)`);
    }
  }
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const next = current[key];
    if (!isRecordLike(next)) {
      current[key] = isIndexKey(segments[i + 1]) ? [] : {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
  return obj;
}

/**
 * Deletes the value at path; mutates obj. Returns true if a property was
 * removed, false if the path did not resolve to an existing own property.
 * Prototype-pollution safe: forbidden segments are never traversed.
 */
export function deleteByPath(obj: unknown, path: PropertyPath): boolean {
  const segments = toPathSegments(path);
  if (segments.length === 0 || !isRecordLike(obj)) {
    return false;
  }
  for (const seg of segments) {
    if (FORBIDDEN_KEYS.has(seg)) {
      return false;
    }
  }
  let current: Record<string, unknown> = obj as Record<string, unknown>;
  for (let i = 0; i < segments.length - 1; i++) {
    const next = current[segments[i]];
    if (!isRecordLike(next)) {
      return false;
    }
    current = next as Record<string, unknown>;
  }
  const last = segments[segments.length - 1];
  if (Object.hasOwn(current, last)) {
    delete current[last];
    return true;
  }
  return false;
}
