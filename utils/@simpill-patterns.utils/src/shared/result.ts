import { AppError, ERROR_CODES } from "@simpill/errors.utils";
import { ERROR_UNKNOWN_ERROR } from "./constants";

/**
 * Result type: Ok(T) | Err(E). Use for success/failure flow without throwing.
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/** Success result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Failure result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Type guard: true if result is Ok. */
export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok === true;
}

/** Type guard: true if result is Err. */
export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return r.ok === false;
}

/** Value if Ok, else fallback. */
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

/** Run sync fn; return Ok(value) or Err(caught). */
export function fromThrowable<T>(fn: () => T): Result<T, unknown> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e);
  }
}

const defaultMapError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, { code: ERROR_CODES.INTERNAL, cause: error });
  }
  return new AppError(ERROR_UNKNOWN_ERROR, { code: ERROR_CODES.INTERNAL, cause: error });
};

/** Await promise; return Ok(value) or Err(mapError(e)). Default mapError yields AppError. */
export async function toResult<T>(
  promise: Promise<T>,
  mapError: (error: unknown) => AppError = defaultMapError
): Promise<Result<T, AppError>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(mapError(error));
  }
}

/** Run async fn(); same as toResult(fn(), mapError). */
export async function fromPromise<T>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => AppError = defaultMapError
): Promise<Result<T, AppError>> {
  return toResult(fn(), mapError);
}
