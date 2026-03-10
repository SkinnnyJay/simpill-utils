/**
 * Common Zod transform helpers: trim, lower, upper, coerce, pipe.
 */

import { z } from "zod";

/**
 * Preprocesses string with trim. Use with z.string().
 */
export function trimString<T extends z.ZodString>(schema: T): z.ZodEffects<T, string, string> {
  return schema.transform((s) => s.trim());
}

/**
 * Preprocesses string to lowercase. Use with z.string().
 */
export function lowerString<T extends z.ZodString>(schema: T): z.ZodEffects<T, string, string> {
  return schema.transform((s) => s.toLowerCase());
}

/**
 * Preprocesses string to uppercase. Use with z.string().
 */
export function upperString<T extends z.ZodString>(schema: T): z.ZodEffects<T, string, string> {
  return schema.transform((s) => s.toUpperCase());
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
