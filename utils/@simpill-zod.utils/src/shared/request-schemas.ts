/** Request/query schemas: coercion, pagination, IDs. */
import { z } from "zod";

/** Default maximum limit for pagination (page size). */
export const DEFAULT_PAGINATION_LIMIT = 100;

/** Coerces query param (string) to number. Use for ?page=1&limit=10. */
export const coerceQueryNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? Number(v) : v))
  .pipe(z.number().finite());

/** Coerces query param to boolean. Accepts "true"/"1"/"yes" as true, "false"/"0"/"no"/"" as false. */
export const coerceQueryBoolean = z
  .union([z.boolean(), z.string()])
  .transform((v) => {
    if (typeof v === "boolean") {
      return v;
    }
    const s = String(v).toLowerCase().trim();
    if (s === "true" || s === "1" || s === "yes") {
      return true;
    }
    if (s === "false" || s === "0" || s === "no" || s === "") {
      return false;
    }
    return Boolean(v);
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

/** Coerces route/query string ID to number. Use for /users/:id. */
export const idParamNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "string" ? Number(v) : v))
  .pipe(z.number().int().positive());

/** UUID string for route/query params. */
export const idParamUuid = z.string().uuid();
