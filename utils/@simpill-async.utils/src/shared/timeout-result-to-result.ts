import { AppError, ERROR_CODES } from "@simpill/errors.utils";
import { err, ok, type Result } from "@simpill/patterns.utils";
import { ERROR_ASYNC_OPERATION_FAILED } from "./constants";
import { timeoutResult } from "./timeout-result";

/** Options for timeoutResultToResult: timeout error/message/code, mapError for rejections. */
export interface TimeoutResultToResultOptions {
  timeoutError?: Error;
  timeoutMessage?: string;
  timeoutCode?: string;
  mapError?: (error: unknown) => AppError;
}

const defaultMapError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, { code: ERROR_CODES.INTERNAL, cause: error });
  }
  return new AppError(ERROR_ASYNC_OPERATION_FAILED, {
    code: ERROR_CODES.INTERNAL,
    cause: error,
  });
};

/**
 * Convert timeoutResult into Result with AppError (fulfilled -> Ok, timeout/rejection -> Err).
 * @param promise - Promise to run with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @param options - timeoutError, timeoutMessage, timeoutCode, mapError
 * @returns Promise of Result<T, AppError>
 */
export async function timeoutResultToResult<T>(
  promise: Promise<T>,
  timeoutMs: number,
  options: TimeoutResultToResultOptions = {},
): Promise<Result<T, AppError>> {
  const result = await timeoutResult(promise, timeoutMs, options.timeoutError);
  if (result.status === "fulfilled") {
    return ok(result.value);
  }
  if (result.status === "rejected") {
    const mapError = options.mapError ?? defaultMapError;
    return err(mapError(result.reason));
  }

  const timeoutMessage =
    options.timeoutMessage ??
    options.timeoutError?.message ??
    `Operation timed out after ${timeoutMs}ms`;
  const timeoutCode = options.timeoutCode ?? ERROR_CODES.TIMEOUT;
  const timeoutError =
    options.timeoutError instanceof AppError
      ? options.timeoutError
      : new AppError(timeoutMessage, { code: timeoutCode, cause: options.timeoutError });

  return err(timeoutError);
}
