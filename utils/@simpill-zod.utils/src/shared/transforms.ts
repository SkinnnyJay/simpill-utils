/**
 * Common Zod transform helpers: trim, lower, upper, coerce, pipe.
 */

import { z } from "zod";

/**
 * Preprocesses string with trim BEFORE the schema's own checks run.
 * Previously this used .transform(), which runs AFTER validation — so
 * trimString(z.string().min(1)) accepted " " (passes min(1) pre-trim)
 * and emitted "", violating the schema's stated contract.
 * Non-string inputs pass through untouched so the inner schema reports
 * the proper type error.
 */
export function trimString<T extends z.ZodString>(schema: T) {
  return z.preprocess((v) => (typeof v === "string" ? v.trim() : v), schema);
}

/**
 * Preprocesses string to lowercase BEFORE the schema's checks run
 * (same post-validation ordering bug as trimString, now fixed):
 * lowerString(z.string().regex(/^[a-z]+$/)).parse("ABC") now yields "abc"
 * instead of rejecting input it was documented to normalize.
 */
export function lowerString<T extends z.ZodString>(schema: T) {
  return z.preprocess((v) => (typeof v === "string" ? v.toLowerCase() : v), schema);
}

/**
 * Preprocesses string to uppercase BEFORE the schema's checks run.
 */
export function upperString<T extends z.ZodString>(schema: T) {
  return z.preprocess((v) => (typeof v === "string" ? v.toUpperCase() : v), schema);
}

/**
 * Coerces optional/unknown to string; empty or undefined becomes undefined.
 */
export const coerceOptionalString = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((v) => {
    if (v === undefined || v === null) {
      return undefined;
    }
    const s = String(v).trim();
    return s === "" ? undefined : s;
  });

/**
 * Pipes multiple transform steps (each receives previous output).
 * First schema parses input; subsequent steps receive the previous result.
 */
export function pipeTransforms<I, A, B>(
  first: z.ZodType<A, z.ZodTypeDef, I>,
  second: z.ZodType<B, z.ZodTypeDef, A>
): z.ZodType<B, z.ZodTypeDef, I> {
  return first.pipe(second);
}
