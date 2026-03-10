import { type Gate, type RunOptions, Semaphore } from "@simpill/async.utils";

/** Bulkhead: Gate that limits concurrency (alias for Gate). */
export type Bulkhead = Gate;

/**
 * Create a bulkhead that limits concurrent executions to `limit` using a Semaphore.
 * @param limit - Max concurrent runs
 * @returns Gate with run(fn, options)
 * @throws Error if limit < 1 (via Semaphore)
 */
export function createBulkhead(limit: number): Bulkhead {
  const sem = new Semaphore(limit);
  return {
    async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
      return sem.run(fn, options);
    },
  };
}
