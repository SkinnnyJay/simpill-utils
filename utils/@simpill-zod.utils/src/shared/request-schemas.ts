/** Request/query schemas: coercion, pagination, IDs. */
import { z } from "zod";

/** Default maximum limit for pagination (page size). */
export const DEFAULT_PAGINATION_LIMIT = 100;

/**
 * Coerces query param (string) to number. Use for ?page=1&limit=10.
 * Empty / whitespace-only strings are REJECTED: Number("") is 0 in JS, so
 * `?page=` previously coerced a missing value into 0 silently.
 */
export const coerceQueryNumber = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    if (typeof v === "number") {
      return v;
    }
    if (v.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected number, received empty string",
      });
      return z.NEVER;
    }
    return Number(v);
  })
  .pipe(z.number().finite());

const TRUE_WORDS = new Set(["true", "1", "yes", "y", "on"]);
const FALSE_WORDS = new Set(["false", "0", "no", "n", "off", ""]);

/**
 * Coerces query param to boolean. Accepts true/1/yes/y/on as true and
 * false/0/no/n/off/"" as false (case-insensitive, trimmed).
 * Any OTHER string is a validation error: previously unrecognized strings
 * fell through to Boolean(v), so `?flag=banana` parsed as true — and worse,
 * "off" and "n" (non-empty strings) parsed as TRUE.
 */
export const coerceQueryBoolean = z
  .union([z.boolean(), z.string()])
  .transform((v, ctx) => {
    if (typeof v === "boolean") {
      return v;
    }
    const s = v.toLowerCase().trim();
    if (TRUE_WORDS.has(s)) {
      return true;
    }
    if (FALSE_WORDS.has(s)) {
      return false;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Expected boolean-like string (true/false/1/0/yes/no/y/n/on/off), received "${v}"`,
    });
    return z.NEVER;
  })
  .pipe(z.boolean());

/** Positive int for page (1-based). */
export const pageNumber = z.number().int().positive().default(1);

/** Positive int for limit (cap optional). */
export function limitNumber(max = DEFAULT_PAGINATION_LIMIT) {
  return z.number().int().positive().max(max).default(10);
}

/** Common pagination shape: page, limit. Use with searchParams or JSON body. */
export function paginationSchema(maxLimit = DEFAULT_PAGINATION_LIMIT) {
  return z.object({
    page: pageNumber,
    limit: limitNumber(maxLimit),
  });
}

/** Offset-based pagination: offset, limit. */
export function offsetPaginationSchema(maxLimit = DEFAULT_PAGINATION_LIMIT) {
  return z.object({
    offset: z.number().int().min(0).default(0),
    limit: limitNumber(maxLimit),
  });
}

/**
 * Coerces route/query string ID to positive int. Use for /users/:id.
 * String input must be decimal digits: "0x10" (-> 16) and "1e3" (-> 1000)
 * previously slipped through via bare Number() coercion — no real router
 * emits hex or exponent-notation path IDs, so those are now rejected.
 */
export const idParamNumber = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    if (typeof v === "number") {
      return v;
    }
    const s = v.trim();
    if (!/^\d+$/.test(s)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected numeric ID (decimal digits)",
      });
      return z.NEVER;
    }
    return Number(s);
  })
  .pipe(z.number().int().positive());

/** UUID string for route/query params. */
export const idParamUuid = z.string().uuid();

/**
 * Normalizes a query param that may arrive as a single value or repeated
 * (?tag=a -> "a", ?tag=a&tag=b -> ["a","b"]) into a validated array.
 * undefined becomes [] so `.default`-less optional params stay ergonomic.
 * @example coerceQueryArray(z.string()).parse("a") // ["a"]
 */
export function coerceQueryArray<Item extends z.ZodType>(item: Item) {
  return z
    .unknown()
    .transform((v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]))
    .pipe(z.array(item));
}
