import type { AppErrorMeta } from "./app-error";
import { ERROR, UNKNOWN_ERROR } from "./constants";

/** Plain object representation of an error (name, message, optional code, meta, stack, cause, errors, props, data). */
export interface SerializedError {
  name: string;
  message: string;
  code?: string;
  meta?: AppErrorMeta;
  stack?: string;
  /** Cause chain when serializeError(..., { includeCause: true }). */
  cause?: SerializedError;
  /** Inner errors of an AggregateError (always included when present). */
  errors?: SerializedError[];
  /** Extra own enumerable properties found on the error (e.g. Node's errno/syscall/path). */
  props?: Record<string, unknown>;
  /** Original non-error value when something other than an Error was thrown. */
  data?: unknown;
}

const DEFAULT_MAX_CAUSE_DEPTH = 5;
const DEFAULT_MAX_VALUE_DEPTH = 5;
const CIRCULAR = "[Circular]";
/** Keys handled explicitly; never duplicated into `props`. */
const OWN_KEYS = new Set(["name", "message", "code", "meta", "stack", "cause", "errors"]);

function hasCode(err: object): err is { code: string } {
  return "code" in err && typeof (err as { code?: unknown }).code === "string";
}

function hasMeta(err: object): err is { meta: AppErrorMeta } {
  return "meta" in err && (err as { meta?: unknown }).meta != null;
}

function hasCause(err: object): err is { cause: unknown } {
  return "cause" in err && (err as { cause?: unknown }).cause !== undefined;
}

/** Cross-realm-safe Error check: native Error.isError (ES2025) when available, else instanceof + brand check. */
export function isError(value: unknown): value is Error {
  const nativeIsError = (Error as unknown as { isError?: (v: unknown) => boolean }).isError;
  if (typeof nativeIsError === "function") return nativeIsError(value);
  return value instanceof Error || Object.prototype.toString.call(value) === "[object Error]";
}

/** Duck-type check for error-shaped values (cross-realm objects, postMessage payloads, deserialized errors). */
export function isErrorLike(
  value: unknown
): value is { name: string; message: string; stack?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

/**
 * Deep-sanitize an arbitrary value so the result is ALWAYS safe to JSON.stringify:
 * circular references become "[Circular]", bigint/symbol/function become string
 * descriptions, nested Errors become their name/message, depth is capped.
 */
export function sanitizeForJson(
  value: unknown,
  maxDepth: number = DEFAULT_MAX_VALUE_DEPTH
): unknown {
  return sanitizeValue(value, 0, maxDepth, new WeakSet());
}

function sanitizeValue(
  value: unknown,
  depth: number,
  maxDepth: number,
  seen: WeakSet<object>
): unknown {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (t === "bigint") return `${String(value)}n`;
  if (t === "symbol") return String(value);
  if (t === "function") return `[Function: ${(value as { name?: string }).name || "anonymous"}]`;
  // object from here on
  const obj = value as object;
  if (seen.has(obj)) return CIRCULAR;
  if (depth >= maxDepth) return Array.isArray(obj) ? "[Array]" : "[Object]";
  if (obj instanceof Date)
    return Number.isNaN(obj.getTime()) ? "[Invalid Date]" : obj.toISOString();
  if (isError(obj) || isErrorLike(obj)) {
    const e = obj as { name?: string; message?: string };
    return {
      name: typeof e.name === "string" ? e.name : ERROR,
      message: typeof e.message === "string" ? e.message : "",
    };
  }
  seen.add(obj);
  try {
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizeValue(item, depth + 1, maxDepth, seen));
    }
    if (obj instanceof Map) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of obj) out[String(k)] = sanitizeValue(v, depth + 1, maxDepth, seen);
      return out;
    }
    if (obj instanceof Set) {
      return Array.from(obj, (item) => sanitizeValue(item, depth + 1, maxDepth, seen));
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      out[key] = sanitizeValue((obj as Record<string, unknown>)[key], depth + 1, maxDepth, seen);
    }
    return out;
  } finally {
    seen.delete(obj);
  }
}

/**
 * Serialize any thrown value to a plain object that is ALWAYS safe to JSON.stringify.
 * - Circular cause chains are cycle-detected and cut with "[Circular]" (not walked to the depth cap).
 * - Circular or non-serializable values inside meta/props are sanitized, never throw.
 * - AggregateError inner `errors` are serialized.
 * - Extra own enumerable properties (Node's errno/syscall/path, custom fields) are preserved under `props`.
 * - Error-like objects (name+message, e.g. cross-realm or postMessage payloads) keep their identity.
 * - Non-error primitives keep their value in `message`; other values are attached as sanitized `data`.
 */
export function serializeError(
  error: unknown,
  options?: { includeStack?: boolean; includeCause?: boolean; maxCauseDepth?: number }
): SerializedError {
  const includeStack = options?.includeStack ?? false;
  const includeCause = options?.includeCause ?? false;
  const maxCauseDepth = options?.maxCauseDepth ?? DEFAULT_MAX_CAUSE_DEPTH;
  const seen = new WeakSet<object>();

  function serializeOne(err: unknown, depth: number): SerializedError {
    if (isError(err) || isErrorLike(err)) {
      const e = err as Error & Record<string, unknown>;
      if (seen.has(e)) return { name: e.name || ERROR, message: CIRCULAR };
      seen.add(e);
      const base: SerializedError = {
        name: typeof e.name === "string" ? e.name : ERROR,
        message: typeof e.message === "string" ? e.message : UNKNOWN_ERROR,
      };
      if (hasCode(e)) base.code = e.code;
      if (hasMeta(e)) base.meta = sanitizeForJson(e.meta) as AppErrorMeta;
      if (includeStack && typeof e.stack === "string") base.stack = e.stack;
      const errors = (e as { errors?: unknown }).errors;
      if (Array.isArray(errors) && errors.length > 0 && depth < maxCauseDepth) {
        base.errors = errors.map((inner) => serializeOne(inner, depth + 1));
      }
      if (includeCause && depth < maxCauseDepth && hasCause(e)) {
        base.cause = serializeOne(e.cause, depth + 1);
      }
      const props = collectExtraProps(e);
      if (props) base.props = sanitizeForJson(props) as Record<string, unknown>;
      return base;
    }
    if (typeof err === "string") return { name: ERROR, message: err };
    if (typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
      return { name: ERROR, message: String(err) };
    }
    const base: SerializedError = { name: ERROR, message: UNKNOWN_ERROR };
    if (err !== null && err !== undefined) base.data = sanitizeForJson(err);
    return base;
  }

  return serializeOne(error, 0);
}

function collectExtraProps(err: object): Record<string, unknown> | undefined {
  let props: Record<string, unknown> | undefined;
  for (const key of Object.keys(err)) {
    if (OWN_KEYS.has(key)) continue;
    if (!props) props = {};
    props[key] = (err as Record<string, unknown>)[key];
  }
  return props;
}

/**
 * Rebuild an Error instance from a SerializedError (reverse of serializeError).
 * Restores name, message, stack, code, meta, the cause chain, and AggregateError-style inner errors.
 */
export function deserializeError(serialized: SerializedError): Error {
  const err = new Error(
    typeof serialized.message === "string" ? serialized.message : UNKNOWN_ERROR
  );
  if (typeof serialized.name === "string" && serialized.name !== ERROR) {
    Object.defineProperty(err, "name", {
      value: serialized.name,
      writable: true,
      configurable: true,
    });
  }
  if (typeof serialized.stack === "string") {
    Object.defineProperty(err, "stack", {
      value: serialized.stack,
      writable: true,
      configurable: true,
    });
  }
  if (typeof serialized.code === "string") {
    Object.defineProperty(err, "code", {
      value: serialized.code,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  if (serialized.meta && typeof serialized.meta === "object") {
    Object.defineProperty(err, "meta", {
      value: serialized.meta,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  if (serialized.cause && typeof serialized.cause === "object") {
    Object.defineProperty(err, "cause", {
      value: deserializeError(serialized.cause),
      writable: true,
      configurable: true,
    });
  }
  if (Array.isArray(serialized.errors)) {
    Object.defineProperty(err, "errors", {
      value: serialized.errors.map((inner) => deserializeError(inner)),
      writable: true,
      configurable: true,
    });
  }
  if (serialized.props && typeof serialized.props === "object") {
    for (const key of Object.keys(serialized.props)) {
      if (OWN_KEYS.has(key)) continue;
      (err as unknown as Record<string, unknown>)[key] = serialized.props[key];
    }
  }
  return err;
}
