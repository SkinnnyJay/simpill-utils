/**
 * @file Safe Stringify
 * @description Never-throwing JSON serialization for log output.
 *
 * JSON.stringify throws on circular references and BigInt, and a throwing
 * toJSON() propagates. In a logger any of those means the log entry is lost.
 * safeStringify never throws: it tries native JSON.stringify first (the fast
 * path — zero overhead for the overwhelmingly common serializable case) and
 * only falls back to a resilient walker when the native call fails.
 */

import { SAFE_STRINGIFY_TOKENS } from "./constants";

/** Maximum object depth for the fallback walker before truncating. */
const MAX_SAFE_DEPTH = 64;

/**
 * Serialize a value to JSON, never throwing.
 *
 * Fast path: native JSON.stringify (identical output for serializable input).
 * Fallback (only when native throws): circular references become
 * "[Circular]", BigInt becomes its decimal string, throwing toJSON/getters
 * become "[Unserializable: <reason>]", depth is capped.
 *
 * @param value - Value to serialize
 * @returns JSON string; "null" for undefined/function/symbol roots
 *          (JSON.stringify returns undefined for those — a logger needs a string)
 */
export function safeStringify(value: unknown): string {
  try {
    const result = JSON.stringify(value);
    // JSON.stringify(undefined | function | symbol) returns undefined, not a string
    if (result !== undefined) {
      return result;
    }
  } catch {
    // Circular / BigInt / throwing toJSON — take the resilient path
  }
  const sanitized = sanitizeForJson(value, new WeakSet(), MAX_SAFE_DEPTH);
  try {
    return JSON.stringify(sanitized) ?? SAFE_STRINGIFY_TOKENS.NULL;
  } catch {
    return SAFE_STRINGIFY_TOKENS.NULL;
  }
}

/**
 * Recursively convert a value into something JSON.stringify can always handle.
 * Exported for adapters that build JSON objects field-by-field.
 */
export function sanitizeForJson(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (value === null || value === undefined) {
    return value === undefined ? undefined : null;
  }

  const valueType = typeof value;

  if (valueType === "string" || valueType === "boolean") {
    return value;
  }
  if (valueType === "number") {
    return Number.isFinite(value as number) ? value : String(value);
  }
  if (valueType === "bigint") {
    return `${value}`;
  }
  if (valueType === "function" || valueType === "symbol") {
    // Match JSON.stringify semantics: dropped as properties; caller decides for roots
    return undefined;
  }

  const obj = value as object;

  if (seen.has(obj)) {
    return SAFE_STRINGIFY_TOKENS.CIRCULAR;
  }
  if (depth <= 0) {
    return SAFE_STRINGIFY_TOKENS.DEPTH;
  }

  // Respect toJSON when it works (Date, custom classes); fall through when it throws
  if (typeof (obj as { toJSON?: () => unknown }).toJSON === "function") {
    try {
      const jsonValue = (obj as { toJSON: () => unknown }).toJSON();
      // Guard toJSON returning the same object (would loop)
      if (jsonValue !== obj) {
        seen.add(obj);
        const result = sanitizeForJson(jsonValue, seen, depth - 1);
        seen.delete(obj);
        return result;
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return `${SAFE_STRINGIFY_TOKENS.UNSERIALIZABLE_PREFIX}${reason}]`;
    }
  }

  seen.add(obj);

  let result: unknown;
  if (Array.isArray(obj)) {
    const arr: unknown[] = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      const item = sanitizeForJson(obj[i], seen, depth - 1);
      // JSON.stringify turns undefined array items into null
      arr[i] = item === undefined ? null : item;
    }
    result = arr;
  } else {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      let raw: unknown;
      try {
        raw = (obj as Record<string, unknown>)[key];
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        out[key] = `${SAFE_STRINGIFY_TOKENS.UNSERIALIZABLE_PREFIX}${reason}]`;
        continue;
      }
      const sanitizedValue = sanitizeForJson(raw, seen, depth - 1);
      if (sanitizedValue !== undefined) {
        out[key] = sanitizedValue;
      }
    }
    result = out;
  }

  seen.delete(obj);
  return result;
}
