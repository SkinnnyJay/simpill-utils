import { serializeError } from "@simpill/errors.utils";
import { flattenZodError, safeParseResult } from "@simpill/zod.utils";
import type { z } from "zod";
import type { ActionResult } from "../shared";
import { ERROR_CODE_SERVER, ERROR_CODE_VALIDATION, ERROR_VALIDATION_FAILED } from "./constants";

export interface CreateSafeActionOptions<TOut> {
  /** Optional Zod schema to validate handler output before returning. */
  outputSchema?: z.ZodType<TOut>;
}

/**
 * Wraps a server function with Zod input validation.
 * Returns { data, error } (errors as data); does not throw to the error boundary.
 */
export function createSafeAction<TIn, TOut>(
  inputSchema: z.ZodType<TIn>,
  handler: (input: TIn) => Promise<TOut> | TOut,
  _options?: CreateSafeActionOptions<TOut>
): (input: unknown) => Promise<ActionResult<TOut>> {
  return async (input: unknown): Promise<ActionResult<TOut>> => {
    const parsed = safeParseResult(inputSchema, input);
    if (!parsed.success) {
      const validation = flattenZodError(parsed.error);
      const firstMessage = parsed.error.issues[0]?.message ?? ERROR_VALIDATION_FAILED;
      return {
        error: {
          message: firstMessage,
          code: ERROR_CODE_VALIDATION,
          validation,
        },
      };
    }
    try {
      const data = await handler(parsed.data);
      return { data };
    } catch (err) {
      const serialized = serializeError(err, { includeStack: false });
      return {
        error: {
          message: serialized.message,
          code: serialized.code ?? ERROR_CODE_SERVER,
        },
      };
    }
  };
}
