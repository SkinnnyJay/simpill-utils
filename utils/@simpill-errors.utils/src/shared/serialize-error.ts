import type { AppErrorMeta } from "./app-error";
import { ERROR, UNKNOWN_ERROR } from "./constants";

/** Plain object representation of an error (name, message, optional code, meta, stack, cause). */
export interface SerializedError {
  name: string;
  message: string;
  code?: string;
  meta?: AppErrorMeta;
  stack?: string;
  /** Cause chain when serializeError(..., { includeCause: true }). */
  cause?: SerializedError;
}

const DEFAULT_MAX_CAUSE_DEPTH = 5;

function hasCode(err: Error): err is Error & { code: string } {
  return "code" in err && typeof (err as { code?: string }).code === "string";
}

function hasMeta(err: Error): err is Error & { meta: AppErrorMeta } {
  return "meta" in err && (err as { meta?: AppErrorMeta }).meta != null;
}

function hasCause(err: Error): err is Error & { cause: unknown } {
  return "cause" in err && (err as { cause?: unknown }).cause !== undefined;
}

/** Serialize error to plain object (name, message, code, meta; optional stack/cause via options). If error.meta or cause chain contain circular references, JSON.stringify of the result may throw; sanitize meta at the source or use a safe stringify for logging. */
export function serializeError(
  error: unknown,
  options?: { includeStack?: boolean; includeCause?: boolean; maxCauseDepth?: number }
): SerializedError {
  const includeStack = options?.includeStack ?? false;
  const includeCause = options?.includeCause ?? false;
  const maxCauseDepth = options?.maxCauseDepth ?? DEFAULT_MAX_CAUSE_DEPTH;

  function serializeOne(err: unknown, depth: number): SerializedError {
    if (err instanceof Error) {
      const base: SerializedError = {
        name: err.name,
        message: err.message,
      };
      if (hasCode(err)) base.code = err.code;
      if (hasMeta(err)) base.meta = err.meta;
      if (includeStack && err.stack) base.stack = err.stack;
      if (includeCause && depth < maxCauseDepth && hasCause(err)) {
        base.cause = serializeOne(err.cause, depth + 1);
      }
      return base;
    }
    return {
      name: ERROR,
      message: typeof err === "string" ? err : UNKNOWN_ERROR,
    };
  }

  return serializeOne(error, 0);
}
