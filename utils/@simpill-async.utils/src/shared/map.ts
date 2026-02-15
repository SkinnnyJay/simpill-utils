import type { RunOptions } from "./concurrency.utils";
import { ERROR_NAME_ABORT, ERROR_OPERATION_ABORTED } from "./constants";
import { createLimit } from "./limit";

/** Options for mapAsync/mapConcurrent: optional concurrency cap. */
export type MapOptions = RunOptions & {
  concurrency?: number;
};

const createAbortError = (): Error => {
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw createAbortError();
};

/** Map over items with optional concurrency; preserves order. */
export async function mapAsync<T, R>(
  items: Iterable<T>,
  mapper: (item: T, index: number) => Promise<R>,
  options?: MapOptions,
): Promise<R[]> {
  throwIfAborted(options?.signal);
  const values = Array.from(items);
  const concurrency = options?.concurrency;
  if (!concurrency || concurrency >= values.length) {
    return Promise.all(
      values.map((value, index) => {
        throwIfAborted(options?.signal);
        return mapper(value, index);
      }),
    );
  }

  const limit = createLimit(concurrency);
  return Promise.all(
    values.map((value, index) => limit.runWithOptions(mapper, options, value, index)),
  );
}

/** Alias of mapAsync: map with concurrency limit. */
export async function mapConcurrent<T, R>(
  items: Iterable<T>,
  mapper: (item: T, index: number) => Promise<R>,
  options?: MapOptions,
): Promise<R[]> {
  return mapAsync(items, mapper, options);
}
