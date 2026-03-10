/**
 * Parallel execution: map with concurrency limit, pool.
 * No function over 50 lines; file under 400 lines.
 */

import type { RunOptions } from "./concurrency.utils";
import { Semaphore } from "./concurrency.utils";
import {
  ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1,
  ERROR_NAME_ABORT,
  ERROR_OPERATION_ABORTED,
  VALUE_1,
} from "./constants";

/**
 * Map over items with a max concurrency. Returns results in order.
 */
export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  options?: RunOptions,
): Promise<R[]> {
  if (concurrency < VALUE_1) throw new Error(ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1);
  if (options?.signal?.aborted) {
    const error = new Error(ERROR_OPERATION_ABORTED);
    error.name = ERROR_NAME_ABORT;
    throw error;
  }
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      if (options?.signal?.aborted) {
        const error = new Error(ERROR_OPERATION_ABORTED);
        error.name = ERROR_NAME_ABORT;
        throw error;
      }
      const i = index++;
      if (i >= items.length) break;
      results[i] = await fn(items[i] as T, i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Run an array of thunks with max concurrency. Returns results in order.
 */
export async function parallelRun<T>(
  thunks: Array<() => Promise<T>>,
  concurrency: number,
  options?: RunOptions,
): Promise<T[]> {
  return parallelMap(thunks, (thunk) => thunk(), concurrency, options);
}

/**
 * Pool: run tasks from an async iterator with max concurrency.
 */
export async function pool<T, R>(
  source: AsyncIterable<T> | Iterable<T>,
  concurrency: number,
  fn: (item: T) => Promise<R>,
  options?: RunOptions,
): Promise<R[]> {
  const sem = new Semaphore(concurrency);
  const results: R[] = [];
  const pending: Promise<void>[] = [];

  for await (const item of source) {
    if (options?.signal?.aborted) {
      const error = new Error(ERROR_OPERATION_ABORTED);
      error.name = ERROR_NAME_ABORT;
      throw error;
    }
    pending.push(
      sem.run(async () => {
        results.push(await fn(item));
      }, options),
    );
  }
  await Promise.all(pending);
  return results;
}
