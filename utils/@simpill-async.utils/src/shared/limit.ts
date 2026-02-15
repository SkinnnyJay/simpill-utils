/** Options for createLimit: concurrency and optional rejectOnClear. */
import type { RunOptions } from "./concurrency.utils";
import {
  ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1,
  ERROR_LIMIT_QUEUE_CLEARED,
  ERROR_LIMIT_QUEUE_IS_FULL,
  ERROR_MAX_QUEUE_SIZE_MUST_BE_AT_LEAST_1,
  ERROR_NAME_ABORT,
  ERROR_NAME_OVERFLOW,
  ERROR_OPERATION_ABORTED,
  OVERFLOW_POLICY_DROP_NEWEST,
  OVERFLOW_POLICY_DROP_OLDEST,
} from "./constants";

export type OverflowPolicy = "reject" | "drop_oldest" | "drop_newest";

export type LimitOptions = {
  concurrency: number;
  rejectOnClear?: boolean;
  maxQueueSize?: number;
  onOverflow?: OverflowPolicy;
};

type Task = {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  signal?: AbortSignal;
  onAbort?: () => void;
};

/** Concurrency limiter: callable as limit(fn, ...args), with map, clearQueue, activeCount, pendingCount, concurrency. */
export type Limit = {
  <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult>;
  runWithOptions: <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: RunOptions | undefined,
    ...args: TArgs
  ) => Promise<TResult>;
  map: <T, R>(items: Iterable<T>, mapper: (item: T, index: number) => Promise<R>) => Promise<R[]>;
  clearQueue: () => void;
  readonly activeCount: number;
  readonly pendingCount: number;
  concurrency: number;
};

const createAbortError = (): Error => {
  const error = new Error(ERROR_LIMIT_QUEUE_CLEARED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

const createOverflowError = (): Error => {
  const error = new Error(ERROR_LIMIT_QUEUE_IS_FULL);
  error.name = ERROR_NAME_OVERFLOW;
  return error;
};

const createSignalAbortError = (): Error => {
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw createSignalAbortError();
};

/**
 * Concurrency limiter inspired by p-limit.
 * @param options - Concurrency number or LimitOptions (concurrency, rejectOnClear)
 * @returns Limit: callable, .map, .clearQueue, .activeCount, .pendingCount, .concurrency
 * @throws Error if concurrency < 1
 */
export function createLimit(options: number | LimitOptions): Limit {
  const config = typeof options === "number" ? { concurrency: options } : options;
  if (config.concurrency < 1) {
    throw new Error(ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1);
  }
  if (config.maxQueueSize !== undefined && config.maxQueueSize < 1) {
    throw new Error(ERROR_MAX_QUEUE_SIZE_MUST_BE_AT_LEAST_1);
  }

  let concurrency = config.concurrency;
  let activeCount = 0;
  const queue: Task[] = [];

  const runNext = (): void => {
    while (activeCount < concurrency && queue.length > 0) {
      const task = queue.shift();
      if (!task) return;
      if (task.signal?.aborted) {
        if (task.onAbort) {
          task.signal.removeEventListener("abort", task.onAbort);
          task.onAbort = undefined;
        }
        task.reject(createSignalAbortError());
        continue;
      }
      if (task.onAbort) {
        task.signal?.removeEventListener("abort", task.onAbort);
        task.onAbort = undefined;
      }
      activeCount++;
      Promise.resolve()
        .then(task.fn)
        .then((value) => {
          task.resolve(value);
        })
        .catch((error) => {
          task.reject(error);
        })
        .finally(() => {
          activeCount--;
          runNext();
        });
    }
  };

  const enqueue = <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    options: RunOptions | undefined,
    ...args: TArgs
  ): Promise<TResult> => {
    const signal = options?.signal;
    throwIfAborted(signal);
    return new Promise<TResult>((resolve, reject) => {
      if (config.maxQueueSize !== undefined && queue.length >= config.maxQueueSize) {
        const policy = config.onOverflow ?? "reject";
        const overflowError = createOverflowError();
        if (policy === OVERFLOW_POLICY_DROP_OLDEST) {
          const dropped = queue.shift();
          if (dropped?.signal && dropped.onAbort) {
            dropped.signal.removeEventListener("abort", dropped.onAbort);
            dropped.onAbort = undefined;
          }
          dropped?.reject(overflowError);
        } else if (policy === OVERFLOW_POLICY_DROP_NEWEST) {
          reject(overflowError);
          return;
        } else {
          reject(overflowError);
          return;
        }
      }

      const task: Task = {
        fn: () => fn(...args),
        resolve: resolve as (value: unknown) => void,
        reject,
        signal,
      };
      if (signal) {
        const onAbort = (): void => {
          const index = queue.indexOf(task);
          if (index >= 0) {
            queue.splice(index, 1);
            reject(createSignalAbortError());
          }
        };
        task.onAbort = onAbort;
        signal.addEventListener("abort", onAbort, { once: true });
      }
      queue.push(task);
      runNext();
    });
  };

  const limit = (async <TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult> => {
    return enqueue(fn, undefined, ...args);
  }) as Limit;

  limit.runWithOptions = (fn, options, ...args) => enqueue(fn, options, ...args);

  limit.map = async (items, mapper) => {
    const entries = Array.from(items);
    return Promise.all(entries.map((item, index) => limit(mapper, item, index)));
  };

  limit.clearQueue = () => {
    const pending = queue.splice(0, queue.length);
    for (const task of pending) {
      if (task.signal && task.onAbort) {
        task.signal.removeEventListener("abort", task.onAbort);
        task.onAbort = undefined;
      }
    }
    if (config.rejectOnClear) {
      const error = createAbortError();
      for (const task of pending) {
        setTimeout(() => task.reject(error), 0);
      }
    }
  };

  Object.defineProperty(limit, "activeCount", {
    get: () => activeCount,
  });
  Object.defineProperty(limit, "pendingCount", {
    get: () => queue.length,
  });
  Object.defineProperty(limit, "concurrency", {
    get: () => concurrency,
    set: (value: number) => {
      if (value < 1) {
        throw new Error(ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1);
      }
      concurrency = value;
      runNext();
    },
  });

  return limit;
}

/**
 * Wrap a function so its invocations are limited by concurrency.
 * @param fn - Async function to limit
 * @param options - Concurrency number or LimitOptions
 * @returns Function with same signature that runs under the limit
 */
export function limitFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: number | LimitOptions,
): (...args: TArgs) => Promise<TResult> {
  const limit = createLimit(options);
  return (...args: TArgs) => limit(fn, ...args);
}

/** Alias for createLimit. */
export const limit = createLimit;
