/**
 * Boolean coercion, coalesce, identity, assert, and safe JSON helpers.
 */

import { ASSERTION_FAILED_DEFAULT } from "./constants";

export type ToBooleanOptions = {
  /** Values treated as true (default: ["true", "1", "yes"]). */
  truthy?: string[];
  /** Values treated as false (default: ["false", "0", "no", ""]). */
  falsy?: string[];
  /** Default when value does not match truthy/falsy (default: false). */
  default?: boolean;
};

const DEFAULT_TRUTHY = ["true", "1", "yes"];
const DEFAULT_FALSY = ["false", "0", "no", ""];

/**
 * Coerce value to boolean. For string, uses optional truthy/falsy lists (case-insensitive).
 */
export function toBoolean(value: unknown, options: ToBooleanOptions = {}): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0 && Number.isFinite(value);
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    const truthy = options.truthy ?? DEFAULT_TRUTHY;
    const falsy = options.falsy ?? DEFAULT_FALSY;
    if (truthy.some((t) => t.toLowerCase() === trimmed)) return true;
    if (falsy.some((f) => f.toLowerCase() === trimmed)) return false;
    return options.default ?? false;
  }
  if (value === null || value === undefined) return options.default ?? false;
  return Boolean(value);
}

/** Type guard: value is boolean. */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Returns !value, or fallback when value is undefined. */
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

/**
 * Throws if condition is false. Use for invariants.
 */
export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? ASSERTION_FAILED_DEFAULT);
  }
}

/**
 * Safe JSON.stringify; returns fallback on error or for undefined.
 */
export function toJsonSafe(value: unknown, fallback = ""): string {
  if (value === undefined) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON.parse; returns fallback on error or invalid JSON.
 */
export function parseJsonSafe<T = unknown>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value) as T;
    return parsed;
  } catch {
    return fallback;
  }
}
