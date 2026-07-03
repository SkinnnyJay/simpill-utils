/**
 * Data preparation: defaults, coerce, sanitize for persistence/API.
 */

import { safeAssign } from "./internal.safety";

/**
 * Fills missing values from defaults. Explicit `undefined` values in base no
 * longer clobber defaults: withDefaults({ a: undefined }, { a: 1 }) is
 * { a: 1 } (the original spread produced { a: undefined }).
 */
export function withDefaults<T extends object>(base: T, defaults: Partial<T>): T {
  const out = { ...defaults } as Record<string, unknown>;
  const record = base as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const v = record[key];
    if (v !== undefined) {
      safeAssign(out, key, v);
    }
  }
  return out as T;
}

/**
 * Coerces numbers and numeric strings; everything else returns the fallback.
 * The original ran arbitrary values through Number(), where Number("") === 0,
 * Number(" ") === 0, Number(null) === 0, Number([]) === 0 and
 * Number(true) === 1 — so coerceNumber("", 42) silently returned 0.
 * BigInts convert only when exactly representable.
 */
export function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return fallback;
    }
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : fallback;
  }
  return fallback;
}

const TRUE_STRINGS: ReadonlySet<string> = new Set(["true", "1", "yes", "y", "on"]);
const FALSE_STRINGS: ReadonlySet<string> = new Set(["false", "0", "no", "n", "off"]);

/**
 * Booleans pass through; numbers 1/0 map to true/false; strings are trimmed,
 * lowercased and matched against the yes/no convention
 * (true/false, 1/0, yes/no, y/n, on/off). The original only recognized the
 * number 1/0 and the exact strings "true"/"false" — coerceBoolean("1", false)
 * returned false.
 */
export function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
    return fallback;
  }
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (TRUE_STRINGS.has(s)) {
      return true;
    }
    if (FALSE_STRINGS.has(s)) {
      return false;
    }
  }
  return fallback;
}

export function coerceString(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function sanitizeValue(value: unknown, ancestors: Set<object>): unknown {
  if (value === null) {
    return null;
  }
  const t = typeof value;
  if (t === "number") {
    return Number.isFinite(value as number) ? value : null;
  }
  if (t === "string" || t === "boolean") {
    return value;
  }
  if (t === "bigint") {
    return (value as bigint).toString();
  }
  if (t === "undefined" || t === "function" || t === "symbol") {
    return undefined;
  }

  const obj = value as object;
  if (ancestors.has(obj)) {
    return "[Circular]";
  }

  const withToJson = obj as { toJSON?: unknown };
  if (typeof withToJson.toJSON === "function") {
    ancestors.add(obj);
    try {
      const jsonValue = (withToJson as { toJSON: () => unknown }).toJSON();
      return sanitizeValue(jsonValue, ancestors);
    } catch {
      // A throwing toJSON would make JSON.stringify throw; fall through to a plain walk.
    } finally {
      ancestors.delete(obj);
    }
  }

  ancestors.add(obj);
  let out: unknown;
  if (Array.isArray(obj)) {
    const arr: unknown[] = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      const s = sanitizeValue(obj[i], ancestors);
      arr[i] = s === undefined ? null : s;
    }
    out = arr;
  } else if (obj instanceof Map) {
    const rec: Record<string, unknown> = {};
    for (const [k, v] of obj) {
      const s = sanitizeValue(v, ancestors);
      if (s !== undefined) {
        safeAssign(rec, String(k), s);
      }
    }
    out = rec;
  } else if (obj instanceof Set) {
    const arr: unknown[] = [];
    for (const v of obj) {
      const s = sanitizeValue(v, ancestors);
      arr.push(s === undefined ? null : s);
    }
    out = arr;
  } else {
    const rec: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const s = sanitizeValue(v, ancestors);
      if (s !== undefined) {
        safeAssign(rec, k, s);
      }
    }
    out = rec;
  }
  ancestors.delete(obj);
  return out;
}

/**
 * Converts a value into something JSON.stringify can serialize without
 * throwing and without silent data destruction. The original walked Dates,
 * Maps and Sets as plain records — sanitizeForJson(new Date()) returned {},
 * bigints still made JSON.stringify throw, and circular input crashed with
 * RangeError.
 *
 * Rules (JSON.stringify parity unless noted):
 * - toJSON() is honored (Dates become ISO strings)
 * - Map -> plain object with String(key) keys; Set -> array (both were {})
 * - bigint -> decimal string (JSON.stringify throws on bigint)
 * - NaN / ±Infinity -> null
 * - function / symbol / undefined values: dropped in objects, null in arrays
 * - circular references -> "[Circular]" instead of a crash
 *
 * The declared return type stays T for backward compatibility; the runtime
 * shape of Dates/Maps/Sets/bigints is transformed as described.
 */
export function sanitizeForJson<T>(value: T): T {
  return sanitizeValue(value, new Set()) as T;
}
