import { serializeError } from "@simpill/errors.utils";
import { flattenZodError, safeParseResult } from "@simpill/zod.utils";
import type { z } from "zod";
import type { ActionResult } from "../shared";
import {
  ERROR_CODE_OUTPUT_VALIDATION,
  ERROR_CODE_SERVER,
  ERROR_CODE_VALIDATION,
  ERROR_OUTPUT_VALIDATION_FAILED,
  ERROR_VALIDATION_FAILED,
} from "./constants";

/**
 * Digest prefixes Next.js uses for throw-based control flow:
 * redirect()/permanentRedirect() -> NEXT_REDIRECT
 * notFound() (pre-15.1)          -> NEXT_NOT_FOUND
 * notFound()/unauthorized()/forbidden() -> NEXT_HTTP_ERROR_FALLBACK;<status>
 * plus dynamic rendering bailouts. These MUST be rethrown, never handled as
 * application errors (vercel/next.js#49298; next/navigation unstable_rethrow).
 */
const NEXT_ERROR_DIGEST_PREFIXES = [
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  "NEXT_HTTP_ERROR_FALLBACK",
  "DYNAMIC_SERVER_USAGE",
  "BAILOUT_TO_CLIENT_SIDE_RENDERING",
] as const;

/**
 * True when `err` is a Next.js framework control-flow error (redirect, notFound,
 * unauthorized, forbidden, dynamic bailout) identified by its `digest`. Detection
 * is digest-based so this package keeps its no-`next`-import design and works in
 * plain jest environments.
 */
export function isNextFrameworkError(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err)) {
    return false;
  }
  const digest = (err as { digest?: unknown }).digest;
  if (typeof digest !== "string") {
    return false;
  }
  return NEXT_ERROR_DIGEST_PREFIXES.some(
    (prefix) => digest === prefix || digest.startsWith(`${prefix};`)
  );
}

/** Next.js appends internal fields with this prefix to form-posted FormData. */
const NEXT_INTERNAL_FORM_FIELD_PREFIX = "$ACTION_";

/**
 * Converts FormData to a plain object for schema validation. Repeated fields
 * become arrays; Next.js internal `$ACTION_*` fields are dropped.
 */
function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith(NEXT_INTERNAL_FORM_FIELD_PREFIX)) {
      continue;
    }
    const all = formData.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

export interface CreateSafeActionOptions<TOut> {
  /**
   * Optional Zod schema to validate (and transform) handler output before returning.
   * On failure the client receives a generic OUTPUT_VALIDATION_ERROR — output
   * validation failures describe server data and are not echoed to the client.
   */
  outputSchema?: z.ZodType<TOut>;
  /**
   * Called with the thrown error when the handler fails, and with the ZodError when
   * output validation fails — the observability hook for logging/reporting. Next.js
   * framework control-flow errors (redirect/notFound) are rethrown and never reported.
   */
  onError?: (error: unknown) => void;
}

/**
 * Wraps a server function with Zod input validation.
 * Returns { data, error } (errors as data); does not throw to the error boundary —
 * EXCEPT Next.js control-flow errors (redirect()/notFound()/unauthorized()/forbidden()),
 * which are rethrown so navigation works inside handlers.
 * FormData input that fails direct validation is converted to a plain object
 * (repeated fields -> arrays, $ACTION_* internals dropped) and re-validated, so
 * `<form action={...}>` submissions work against plain-object schemas.
 */
export function createSafeAction<TIn, TOut>(
  inputSchema: z.ZodType<TIn>,
  handler: (input: TIn) => Promise<TOut> | TOut,
  options?: CreateSafeActionOptions<TOut>
): (input: unknown) => Promise<ActionResult<TOut>> {
  return async (input: unknown): Promise<ActionResult<TOut>> => {
    let parsed = safeParseResult(inputSchema, input);
    if (!parsed.success && typeof FormData !== "undefined" && input instanceof FormData) {
      parsed = safeParseResult(inputSchema, formDataToObject(input));
    }
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
      const raw: TOut = await handler(parsed.data);
      let data = raw;
      const outputSchema = options?.outputSchema;
      if (outputSchema !== undefined) {
        const output = outputSchema.safeParse(raw);
        if (!output.success) {
          options?.onError?.(output.error);
          return {
            error: {
              message: ERROR_OUTPUT_VALIDATION_FAILED,
              code: ERROR_CODE_OUTPUT_VALIDATION,
            },
          };
        }
        data = output.data;
      }
      return { data };
    } catch (err) {
      if (isNextFrameworkError(err)) {
        throw err;
      }
      options?.onError?.(err);
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
