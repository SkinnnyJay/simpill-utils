import { APP_ERROR, APPERROR } from "./constants";

/** Optional metadata attached to AppError (serializable). */
export interface AppErrorMeta {
  [key: string]: unknown;
}

/** Domain error with code, message, optional meta/cause; serializable. */
export class AppError extends Error {
  readonly code: string;
  readonly meta: AppErrorMeta;
  readonly cause: unknown;

  constructor(message: string, options?: { code?: string; meta?: AppErrorMeta; cause?: unknown }) {
    super(message);
    this.name = APPERROR;
    this.code = options?.code ?? APP_ERROR;
    this.meta = options?.meta ?? {};
    this.cause = options?.cause ?? undefined;
    Object.setPrototypeOf(this, AppError.prototype);
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
