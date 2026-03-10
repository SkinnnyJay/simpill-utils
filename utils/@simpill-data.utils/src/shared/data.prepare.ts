import { VALUE_0, VALUE_1 } from "./constants";

/**
 * Data preparation: defaults, coerce, sanitize for persistence/API.
 */

export function withDefaults<T extends object>(base: T, defaults: Partial<T>): T {
  return { ...defaults, ...base };
}

export function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === VALUE_1) return true;
  if (value === "false" || value === VALUE_0) return false;
  return fallback;
}

export function coerceString(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function sanitizeForJson<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeForJson) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as object)) {
    if (typeof k === "string") out[k] = sanitizeForJson(v);
  }
  return out as T;
}
