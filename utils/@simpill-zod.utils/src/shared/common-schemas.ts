/**
 * Common reusable schemas for web and API: non-empty string, ISO date, enum from list.
 */

import { z } from "zod";

/** Non-empty string after trim. Useful for required form fields and API strings. */
export const nonEmptyString = z.string().trim().min(1, "Must not be empty");

/** ISO 8601 date-time string. Use for API request/response date fields. */
export const isoDateString = z.string().datetime();

/** ISO date only (YYYY-MM-DD). */
export const isoDateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)");

/**
 * Creates a z.enum from a tuple of strings. Pass at least one value.
 * @example enumFromList(["a", "b"]) or enumFromList(["a", "b"] as const)
 */
export function enumFromList(list: [string, ...string[]]): z.ZodEnum<[string, ...string[]]> {
  return z.enum(list);
}

/** Coerces unknown to string; useful for env or query params that may be number. */
export const coerceString = z.union([z.string(), z.number()]).transform(String);
