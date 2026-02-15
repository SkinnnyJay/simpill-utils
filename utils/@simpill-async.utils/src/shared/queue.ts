import type { RunOptions } from "./concurrency.utils";
import {
  ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1,
  ERROR_MAX_QUEUE_SIZE_MUST_BE_AT_LEAST_1,
  ERROR_NAME_ABORT,
  ERROR_NAME_OVERFLOW,
  ERROR_OPERATION_ABORTED,
  ERROR_QUEUE_CLEARED,
  ERROR_QUEUE_IS_FULL,
  OVERFLOW_POLICY_DROP_OLDEST,
  VALUE_0,
  VALUE_1,
} from "./constants";
import type { OverflowPolicy } from "./limit";

/** Options for createQueue: concurrency, autoStart, backpressure. */
export interface QueueOptions {
  concurrency?: number;
  autoStart?: boolean;
  /** Max pending tasks (waiting). When exceeded, onOverflow applies. */
  maxQueueSize?: number;
  /** When maxQueueSize is set and queue is full: reject new, drop oldest, or drop newest. */
  onOverflow?: OverflowPolicy;
}

/** Async task queue: add, pause, resume, clear, onIdle, size, activeCount, isPaused. */
export interface Queue {
  add<T>(task: () => Promise<T>, options?: RunOptions): Promise<T>;
  pause(): void;
  resume(): void;
  clear(options?: { rejectPending?: boolean; error?: Error }): void;
  onIdle(): Promise<void>;
  readonly size: number;
  readonly activeCount: number;
  readonly isPaused: boolean;
}

type QueueTask<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  signal?: AbortSignal;
  onAbort?: () => void;
};

const createClearError = (): Error => {
  const error = new Error(ERROR_QUEUE_CLEARED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

const createAbortError = (): Error => {
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw createAbortError();
};

const createOverflowError = (): Error => {
  const error = new Error(ERROR_QUEUE_IS_FULL);
  error.name = ERROR_NAME_OVERFLOW;
  return error;
};

/**
 * Async task queue with concurrency control.
 * @param options - concurrency (default 1), autoStart (default true)
 * @returns Queue with add, pause, resume, clear, onIdle
 * @throws Error if concurrency < 1
 */
export function createQueue(options: QueueOptions = {}): Queue {
  const concurrency = options.concurrency ?? VALUE_1;
  const maxQueueSize = options.maxQueueSize;
  const onOverflow = options.onOverflow ?? "reject";
  if (concurrency < VALUE_1) {
    throw new Error(ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1);
  }
  if (maxQueueSize !== undefined && maxQueueSize < 1) {
    throw new Error(ERROR_MAX_QUEUE_SIZE_MUST_BE_AT_LEAST_1);
  }

  let activeCount = VALUE_0;
  let paused = options.autoStart === false;
  const queue: Array<QueueTask<unknown>> = [];
  const idleResolvers: Array<() => void> = [];

  const resolveIdle = (): void => {
    if (activeCount === VALUE_0 && queue.length === VALUE_0) {
      const resolvers = idleResolvers.splice(0, idleResolvers.length);
      for (const resolve of resolvers) resolve();
    }
  };

  const runNext = (): void => {
    if (paused) return;
    while (activeCount < concurrency && queue.length > VALUE_0) {
      const task = queue.shift();
      if (!task) return;
      if (task.signal?.aborted) {
        if (task.onAbort) {
          task.signal.removeEventListener("abort", task.onAbort);
          task.onAbort = undefined;
        }
        task.reject(createAbortError());
        continue;
      }
      if (task.onAbort) {
        task.signal?.removeEventListener("abort", task.onAbort);
        task.onAbort = undefined;
      }
      activeCount++;
      Promise.resolve()
        .then(task.fn)
        .then((value) => task.resolve(value))
        .catch((error) => task.reject(error))
        .finally(() => {
          activeCount--;
          runNext();
          resolveIdle();
        });
    }
  };

  const add = <T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> => {
    const signal = options?.signal;
    throwIfAborted(signal);
    return new Promise<T>((resolve, reject) => {
      if (maxQueueSize !== undefined && queue.length >= maxQueueSize) {
        const overflowError = createOverflowError();
        if (onOverflow === OVERFLOW_POLICY_DROP_OLDEST) {
          const dropped = queue.shift();
          if (dropped?.signal && dropped.onAbort) {
            dropped.signal.removeEventListener("abort", dropped.onAbort);
            dropped.onAbort = undefined;
          }
          dropped?.reject(overflowError);
        } else {
          reject(overflowError);
          return;
        }
      }

      const task: QueueTask<T> = {
        fn,
        resolve: resolve as (value: T) => void,
        reject,
        signal,
      };
      if (signal) {
        const onAbort = (): void => {
          const index = queue.indexOf(task as QueueTask<unknown>);
          if (index >= VALUE_0) {
            queue.splice(index, 1);
            reject(createAbortError());
          }
        };
        task.onAbort = onAbort;
        signal.addEventListener("abort", onAbort, { once: true });
      }
      queue.push(task as QueueTask<unknown>);
      runNext();
    });
  };

  const pause = (): void => {
    paused = true;
  };

  const resume = (): void => {
    if (!paused) return;
    paused = false;
    runNext();
  };

  const clear = (options?: { rejectPending?: boolean; error?: Error }): void => {
    const pending = queue.splice(0, queue.length);
    for (const task of pending) {
      if (task.signal && task.onAbort) {
        task.signal.removeEventListener("abort", task.onAbort);
        task.onAbort = undefined;
      }
    }
    if (!options?.rejectPending) return;
    const error = options.error ?? createClearError();
    for (const task of pending) {
      setTimeout(() => task.reject(error), 0);
    }
  };

  const onIdle = (): Promise<void> => {
    if (activeCount === VALUE_0 && queue.length === VALUE_0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => idleResolvers.push(resolve));
  };

  return {
    add,
    pause,
    resume,
    clear,
    onIdle,
    get size() {
      return queue.length;
    },
    get activeCount() {
      return activeCount;
    },
    get isPaused() {
      return paused;
    },
  };
}
