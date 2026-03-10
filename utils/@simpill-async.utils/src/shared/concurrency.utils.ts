import {
  ERROR_NAME_ABORT,
  ERROR_OPERATION_ABORTED,
  ERROR_SEMAPHORE_PERMITS,
  VALUE_0,
  VALUE_1,
} from "./constants";

/**
 * Concurrency primitives: Semaphore, Mutex, withLimit.
 * No function over 50 lines; file under 400 lines.
 */

/** Options for run/acquire: optional AbortSignal. */
export interface RunOptions {
  signal?: AbortSignal;
}

/** Gate: run an async function (e.g. after acquiring). */
export interface Gate {
  run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T>;
}

/** Lock: acquire, release, and run (acquire-run-release). */
export interface Lock extends Gate {
  acquire(options?: RunOptions): Promise<void>;
  release(): void;
}

const createAbortError = (): Error => {
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw createAbortError();
};

/** Limits concurrent execution to N. permits must be >= 1. */
export class Semaphore implements Lock {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    if (permits < VALUE_1) throw new Error(ERROR_SEMAPHORE_PERMITS);
    this.permits = permits;
  }

  /** Acquire one permit; waits if none available. AbortError if signal aborted. */
  async acquire(options?: RunOptions): Promise<void> {
    const signal = options?.signal;
    throwIfAborted(signal);
    if (this.permits > VALUE_0) {
      this.permits--;
      return;
    }
    await new Promise<void>((resolve, reject) => {
      let queueEntry: () => void;
      const onAbort = (): void => {
        const index = this.waitQueue.indexOf(queueEntry);
        if (index >= VALUE_0) this.waitQueue.splice(index, 1);
        reject(createAbortError());
      };
      queueEntry = (): void => {
        if (signal) signal.removeEventListener("abort", onAbort);
        resolve();
      };
      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
      this.waitQueue.push(queueEntry);
    });
  }

  /** Release one permit (or unblock one waiter). */
  release(): void {
    if (this.waitQueue.length > VALUE_0) {
      const next = this.waitQueue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }

  /** Acquire, run fn, release. */
  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    await this.acquire(options);
    try {
      throwIfAborted(options?.signal);
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Mutex: binary semaphore for exclusive access (one permit).
 */
export class Mutex implements Lock {
  private readonly semaphore = new Semaphore(VALUE_1);

  /** Acquire the mutex; waits if held. */
  async acquire(options?: RunOptions): Promise<void> {
    await this.semaphore.acquire(options);
  }

  /** Release the mutex. */
  release(): void {
    this.semaphore.release();
  }

  /** Acquire, run fn, release. */
  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    return this.semaphore.run(fn, options);
  }
}

/** Run fn through each gate in order. */
export function composeGates(gates: Gate[]): Gate {
  return {
    run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
      const pipeline = gates.reduceRight<() => Promise<T>>(
        (next, gate) => () => gate.run(next, options),
        fn,
      );
      return pipeline();
    },
  };
}

/** Process items with at most limit concurrent; returns results in same order. */
export async function withLimit<T, R>(
  limit: number,
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const sem = new Semaphore(limit);
  const results = await Promise.all(items.map((item, index) => sem.run(() => fn(item, index))));
  return results;
}
