/** Schema helpers: optional/nullable with defaults, string/number/boolean field builders. */
import { z } from "zod";

/** Schema that accepts T | undefined and outputs T using defaultVal when undefined. */
export function optionalWithDefault<T>(schema: z.ZodType<T>, defaultVal: T): z.ZodType<T> {
  const optionalSchema = z.optional(schema);
  return optionalSchema.default(defaultVal as never) as z.ZodType<T>;
}

/** Schema that accepts T | null and outputs T using defaultVal when null. */
export function nullableWithDefault<T>(schema: z.ZodType<T>, defaultVal: T): z.ZodType<T> {
  return z
    .union([schema, z.literal(null)])
    .transform((v) => (v === null ? defaultVal : (v as T))) as z.ZodType<T>;
}

/** String field with optional default (for object shapes). */
export function stringField(
  schema: z.ZodString,
  defaultValue?: string
): z.ZodString | z.ZodDefault<z.ZodString> {
  return defaultValue !== undefined ? schema.default(defaultValue) : schema;
}

/** Number field with optional default (for object shapes). */
export function numberField(
  schema: z.ZodNumber,
  defaultValue?: number
): z.ZodNumber | z.ZodDefault<z.ZodNumber> {
  return defaultValue !== undefined ? schema.default(defaultValue) : schema;
}

/** Boolean field with optional default (for object shapes). */
export function booleanField(
  schema: z.ZodBoolean,
  defaultValue?: boolean
): z.ZodBoolean | z.ZodDefault<z.ZodBoolean> {
  return defaultValue !== undefined ? schema.default(defaultValue) : schema;
}
