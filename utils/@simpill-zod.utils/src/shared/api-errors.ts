/**
 * API error helpers: turn parse failures into consistent validation error payloads.
 */

import type { z } from "zod";
import { flattenZodError } from "./safe-parse";

/** Standard validation error shape for API responses (JSON). */
export type ValidationErrorPayload = {
  code: "VALIDATION_ERROR";
  message: string;
  details: Record<string, string>;
};

/**
 * Converts a failed parse result into a consistent validation error payload for APIs.
 * Use in route handlers: if (!result.success) return res.status(400).json(toValidationError(result)).
 */
export function toValidationError(result: {
  success: false;
  error: z.ZodError;
}): ValidationErrorPayload {
  return {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: flattenZodError(result.error),
  };
}

/**
 * Asserts input parses with schema; throws an Error with payload for API handlers.
 * Useful in backend when you want to throw and catch to return 400 with details.
 */
export function parseOrThrowValidation<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): z.infer<Schema> {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }
  const payload: ValidationErrorPayload = toValidationError(parsed);
  const err = new Error(payload.message) as Error & { payload: ValidationErrorPayload };
  err.payload = payload;
  throw err;
}
