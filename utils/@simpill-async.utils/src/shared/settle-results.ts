import { AppError, ERROR_CODES } from "@simpill/errors.utils";
import { err, ok, type Result } from "@simpill/patterns.utils";
import { ERROR_ASYNC_OPERATION_FAILED } from "./constants";
import { reflect } from "./reflect";

/** Options for settleResults: optional mapError per index. */
export interface SettleResultsOptions {
  mapError?: (error: unknown, index: number) => AppError;
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
 * Settle promises into Result list without throwing.
 * @param promises - Iterable of promises
 * @param options - Optional mapError (error, index) => AppError
 * @returns Promise of array of Result<T, AppError> in same order as promises
 */
export async function settleResults<T>(
  promises: Iterable<Promise<T>>,
  options: SettleResultsOptions = {},
): Promise<Array<Result<T, AppError>>> {
  const entries = Array.from(promises);
  const mapError = options.mapError ?? ((error, _index) => defaultMapError(error));
  const settled = await Promise.all(entries.map((promise) => reflect(promise)));
  return settled.map((result, index) =>
    result.status === "fulfilled" ? ok(result.value) : err(mapError(result.reason, index)),
  );
}
