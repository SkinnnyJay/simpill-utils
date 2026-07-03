import { APP_ERROR, APPERROR } from "./constants";

/** Optional metadata attached to AppError (serializable). */
export interface AppErrorMeta {
  [key: string]: unknown;
}

/** Domain error with code, message, optional meta/cause; serializable. */
export class AppError extends Error {
  readonly code: string;
  readonly meta: AppErrorMeta;
  /** Underlying cause (ES2022 `Error.cause` semantics: present but non-enumerable). */
  declare readonly cause: unknown;

  constructor(message: string, options?: { code?: string; meta?: AppErrorMeta; cause?: unknown }) {
    super(message);
    this.name = APPERROR;
    this.code = options?.code ?? APP_ERROR;
    this.meta = options?.meta ?? {};
    // Match native ES2022 Error cause semantics: own, writable, configurable, NON-enumerable.
    // The previous own enumerable assignment leaked the cause (often internal errors with
    // stack traces) into `{ ...err }` spreads and generic object serializers.
    Object.defineProperty(this, "cause", {
      value: options?.cause ?? undefined,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    Object.setPrototypeOf(this, AppError.prototype);
    // V8: drop the AppError constructor frame from the stack (no-op elsewhere).
    const capture = (Error as unknown as { captureStackTrace?: (t: object, c?: unknown) => void })
      .captureStackTrace;
    if (typeof capture === "function") capture(this, AppError);
  }

  /** Serialize to a plain object (name, message, code, meta). */
  toJSON(): { name: string; message: string; code: string; meta: AppErrorMeta } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      meta: this.meta,
    };
  }
}

/** Type guard for AppError (instanceof plus duck-type for cross-realm/deserialized instances). */
export function isAppError(value: unknown): value is AppError {
  if (value instanceof AppError) return true;
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { name?: unknown }).name === APPERROR &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}
