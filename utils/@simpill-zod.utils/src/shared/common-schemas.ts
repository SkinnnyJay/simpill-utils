/**
 * Common reusable schemas for web and API: non-empty string, ISO date, enum from list.
 */

import { z } from "zod";

/** Non-empty string after trim. Useful for required form fields and API strings. */
export const nonEmptyString = z.string().trim().min(1, "Must not be empty");

/**
 * ISO 8601 date-time string (UTC "Z" only — zod's `.datetime()` default).
 * Rejects numeric offsets like `+02:00`; use isoDateTimeWithOffset for those.
 */
export const isoDateString = z.string().datetime();

/**
 * ISO 8601 date-time string accepting UTC "Z" AND numeric offsets
 * (e.g. `2024-01-01T06:15:00+02:00`). Plain `.datetime()` rejects offsets,
 * a common integration footgun with third-party APIs that emit local offsets.
 */
export const isoDateTimeWithOffset = z.string().datetime({ offset: true });

/**
 * ISO date only (YYYY-MM-DD), calendar-validated: rejects impossible dates
 * such as 2024-02-30, 2024-13-45, or 2023-02-29 (non-leap year), which the
 * previous format-only regex accepted. Leap years handled (2024-02-29 valid).
 */
export const isoDateOnlyString = z.string().date("Invalid date (YYYY-MM-DD)");

type Writeable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Creates a z.enum from a tuple of strings, PRESERVING literal types:
 * enumFromList(["a", "b"]) now infers "a" | "b" (previously the signature
 * widened every tuple to [string, ...string[]], erasing the literals and
 * defeating the point of z.enum). Plain and `as const` tuples both work.
 */
export function enumFromList<const T extends Readonly<[string, ...string[]]>>(
  list: T
): z.ZodEnum<Writeable<T>> {
  return z.enum(list);
}

/** Coerces unknown to string; useful for env or query params that may be number. */
export const coerceString = z.union([z.string(), z.number()]).transform(String);

/**
 * Parses a JSON string, then validates the parsed value with the given schema.
 * Malformed JSON becomes a normal validation issue instead of a thrown SyntaxError.
 * @example jsonString(z.object({ a: z.number() })).parse('{"a":1}') // { a: 1 }
 */
export function jsonString<Schema extends z.ZodType>(schema: Schema) {
  return z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
        return z.NEVER;
      }
    })
    .pipe(schema);
}
