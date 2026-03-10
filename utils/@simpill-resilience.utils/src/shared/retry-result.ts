import { type RetryOptions, retry } from "@simpill/async.utils";
import { AppError, ERROR_CODES } from "@simpill/errors.utils";
import { err, ok, type Result } from "@simpill/patterns.utils";
import { RETRY_FAILED_MESSAGE } from "./constants";

/** Options for retryResult: extends RetryOptions with optional mapError. */
export interface RetryResultOptions extends RetryOptions {
  mapError?: (error: unknown) => AppError;
}

const defaultMapError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, { code: ERROR_CODES.INTERNAL, cause: error });
  }
  return new AppError(RETRY_FAILED_MESSAGE, { code: ERROR_CODES.INTERNAL, cause: error });
};

/**
 * Retry an async function and return Result instead of throwing.
 * @param fn - Async function to run (no args)
 * @param options - Retry options plus optional mapError
 * @returns Promise of Ok(value) or Err(AppError)
 */
export async function retryResult<T>(
  fn: () => Promise<T>,
  options: RetryResultOptions = {},
): Promise<Result<T, AppError>> {
  try {
    const value = await retry(fn, options);
    return ok(value);
  } catch (error) {
    const mapError = options.mapError ?? defaultMapError;
    return err(mapError(error));
  }
}
