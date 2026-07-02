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

const createAbortError = (): Error => {
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

/**
 * Map over items with a max concurrency. Returns results in order.
 * Once any item rejects, no further items are started (in-flight items
 * finish, but no new work is pulled) and the first error is rethrown.
 */
export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  options?: RunOptions,
): Promise<R[]> {
  if (concurrency < VALUE_1) throw new Error(ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1);
  if (options?.signal?.aborted) throw createAbortError();
  const results: R[] = new Array(items.length);
  let index = 0;
  let failed = false;

  async function worker(): Promise<void> {
    while (index < items.length && !failed) {
      if (options?.signal?.aborted) {
        failed = true;
        throw createAbortError();
      }
      const i = index++;
      if (i >= items.length) break;
      try {
        results[i] = await fn(items[i] as T, i);
      } catch (error) {
        failed = true;
        throw error;
      }
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
 * Pool: run tasks from an (async) iterator with max concurrency and real
 * backpressure — the source is only advanced when a permit is free, so at
 * most `concurrency` items are pulled ahead. Works with infinite/large
 * sources without buffering them into memory. Results are returned in
 * source order.
 */
export async function pool<T, R>(
  source: AsyncIterable<T> | Iterable<T>,
  concurrency: number,
  fn: (item: T) => Promise<R>,
  options?: RunOptions,
): Promise<R[]> {
  if (concurrency < VALUE_1) throw new Error(ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1);
  if (options?.signal?.aborted) throw createAbortError();
  const sem = new Semaphore(concurrency);
  const results: R[] = [];
  const pending: Promise<void>[] = [];
  const iterator =
    Symbol.asyncIterator in Object(source)
      ? (source as AsyncIterable<T>)[Symbol.asyncIterator]()
      : (source as Iterable<T>)[Symbol.iterator]();
  let index = 0;
  let failed = false;

  // Acquire a permit BEFORE pulling the next item: this is the backpressure.
  while (true) {
    await sem.acquire(options);
    if (failed) {
      sem.release();
      break;
    }
    if (options?.signal?.aborted) {
      sem.release();
      await Promise.allSettled(pending);
      throw createAbortError();
    }
    let next: IteratorResult<T>;
    try {
      next = await iterator.next();
    } catch (error) {
      sem.release();
      await Promise.allSettled(pending);
      throw error;
    }
    if (next.done) {
      sem.release();
      break;
    }
    const i = index++;
    const item = next.value;
    pending.push(
      (async () => {
        try {
          results[i] = await fn(item);
        } catch (error) {
          failed = true;
          throw error;
        } finally {
          sem.release();
        }
      })(),
    );
  }
  await Promise.all(pending);
  return results;
}
