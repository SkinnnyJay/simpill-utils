/**
 * Boolean coercion, coalesce, identity, assert, and safe JSON helpers.
 */

import { ASSERTION_FAILED_DEFAULT } from "./constants";

export type ToBooleanOptions = {
  /** Values treated as true (default: ["true", "1", "yes", "y", "on"]). */
  truthy?: string[];
  /** Values treated as false (default: ["false", "0", "no", "n", "off", ""]). */
  falsy?: string[];
  /** Default when value does not match truthy/falsy (default: false). */
  default?: boolean;
};

// Precompiled lowercase sets: O(1) lookup instead of per-call
// array.some() with a toLowerCase() allocation per candidate.
// Sets follow the yn / parse-boolean ecosystem convention (y/n/on/off).
const DEFAULT_TRUTHY_SET: ReadonlySet<string> = new Set(["true", "1", "yes", "y", "on"]);
const DEFAULT_FALSY_SET: ReadonlySet<string> = new Set(["false", "0", "no", "n", "off", ""]);

function toLowerSet(values: string[]): Set<string> {
  const set = new Set<string>();
  for (const v of values) set.add(v.toLowerCase());
  return set;
}

/**
 * Coerce value to boolean.
 * - boolean: returned as-is.
 * - number: false only for 0, -0, and NaN (matches Boolean(); Infinity is true).
 * - string: trimmed, case-insensitive match against truthy/falsy lists;
 *   unmatched strings return options.default (default false).
 * - null/undefined: options.default (default false).
 * - anything else: Boolean(value).
 */
export function toBoolean(value: unknown, options: ToBooleanOptions = {}): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    const truthy = options.truthy ? toLowerSet(options.truthy) : DEFAULT_TRUTHY_SET;
    const falsy = options.falsy ? toLowerSet(options.falsy) : DEFAULT_FALSY_SET;
    if (truthy.has(trimmed)) return true;
    if (falsy.has(trimmed)) return false;
    return options.default ?? false;
  }
  if (value === null || value === undefined) return options.default ?? false;
  return Boolean(value);
}

/** Type guard: value is boolean. */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Type guard: value is neither null nor undefined. Pairs with coalesce(). */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Returns the negation of (value ?? fallback).
 * toggle(true) === false; toggle(undefined) === !fallback (=== true with the
 * default fallback of false).
 */
export function toggle(value: boolean | undefined, fallback = false): boolean {
  return !(value ?? fallback);
}

/**
 * Returns the first defined (non-null, non-undefined) value.
 */
export function coalesce<T>(...values: (T | null | undefined)[]): T | undefined {
  for (const v of values) {
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}

/** Identity function. */
export function identity<T>(value: T): T {
  return value;
}

/** No-op function. Useful as a default callback. */
export function noop(): void {
  // intentionally empty
}

/**
 * Throws if condition is falsy. Use for invariants.
 * Accepts any value (truthiness check) and narrows its type, following the
 * tiny-invariant convention. The message may be a function so expensive
 * messages are only built on failure.
 */
export function assert(condition: unknown, message?: string | (() => string)): asserts condition {
  if (!condition) {
    const provided = typeof message === "function" ? message() : message;
    throw new Error(provided ?? ASSERTION_FAILED_DEFAULT);
  }
}

/**
 * Throws if value is null or undefined; otherwise narrows to NonNullable.
 */
export function assertDefined<T>(
  value: T,
  message?: string | (() => string)
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    const provided = typeof message === "function" ? message() : message;
    throw new Error(provided ?? ASSERTION_FAILED_DEFAULT);
  }
}

/**
 * Exhaustiveness guard: unreachable at the type level; throws if reached at
 * runtime (e.g. an unhandled union member arriving from untyped input).
 */
export function assertNever(value: never, message?: string | (() => string)): never {
  const provided = typeof message === "function" ? message() : message;
  throw new Error(provided ?? `Unexpected value: ${String(value)}`);
}

/**
 * Safe JSON.stringify; returns fallback on error or whenever JSON.stringify
 * does not produce a string (undefined, functions, and symbols stringify to
 * undefined rather than throwing). Never returns undefined.
 */
export function toJsonSafe(value: unknown, fallback = ""): string {
  try {
    const result = JSON.stringify(value);
    return result === undefined ? fallback : result;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON.parse; returns fallback on error or invalid JSON.
 * Note: "null" is valid JSON and parses to null (not the fallback).
 */
export function parseJsonSafe<T = unknown>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value) as T;
    return parsed;
  } catch {
    return fallback;
  }
}
