/** Safe-parse result helpers: typed Result, flatten/format Zod errors. */
import type { z } from "zod";

export type ParseResult<T> = { success: true; data: T } | { success: false; error: z.ZodError };

/** Parse input with schema; returns { success, data } or { success: false, error }. */
export function safeParseResult<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): ParseResult<z.infer<Schema>> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Flatten Zod error to path -> message record. When a path has multiple
 * issues, the FIRST issue wins (previously the LAST silently overwrote,
 * hiding the primary failure). Use flattenZodErrorAll to keep every message.
 */
export function flattenZodError(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_";
    if (!(path in out)) {
      out[path] = issue.message;
    }
  }
  return out;
}

/** Flatten Zod error keeping ALL messages per path (path -> string[]). */
export function flattenZodErrorAll(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_";
    if (!(path in out)) {
      out[path] = [];
    }
    out[path].push(issue.message);
  }
  return out;
}

/** Format Zod error as single string (path: message joined by separator). */
export function formatZodError(error: z.ZodError, separator = "; "): string {
  return error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join(separator);
}

/** Parse with schema; throws with formatted message on failure. */
export function parseOrThrow<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): z.infer<Schema> {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  throw new Error(formatZodError(result.error));
}
