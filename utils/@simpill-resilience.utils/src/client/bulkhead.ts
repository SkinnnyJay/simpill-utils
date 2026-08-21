import type { Gate, RunOptions } from "@simpill/async.utils";
import type { BulkheadCreateOptions } from "../shared";
import { ERROR_BULKHEAD_LIMIT, VALUE_0, VALUE_1 } from "../shared/constants";
import { BulkheadRejectedError, createAbortError, throwIfAborted } from "../shared/errors";

export { BulkheadRejectedError } from "../shared/errors";

/** Bulkhead: Gate that limits concurrency (alias for Gate). */
export type Bulkhead = Gate;

/**
 * Create a bulkhead that limits concurrent executions to `limit`.
 * With options.maxQueue set, at most that many calls wait for a slot;
 * further calls reject immediately with BulkheadRejectedError (fast-fail
 * load shedding instead of an unbounded hidden backlog).
 * @param limit - Max concurrent runs (>= 1)
 * @param options - Optional { maxQueue }
 * @returns Gate with run(fn, options)
 * @throws Error if limit < 1
 */
export function createBulkhead(limit: number, options?: BulkheadCreateOptions): Bulkhead {
  if (limit < VALUE_1) throw new Error(ERROR_BULKHEAD_LIMIT);
  const maxQueue = options?.maxQueue;
  let active = 0;
  const queue: Array<() => void> = [];

  return {
    async run<T>(fn: () => Promise<T>, runOptions?: RunOptions): Promise<T> {
      const signal = runOptions?.signal;
      throwIfAborted(signal);
      let inheritedSlot = false;
      if (active >= limit) {
        if (maxQueue != null && queue.length >= maxQueue) {
          throw new BulkheadRejectedError();
        }
        await new Promise<void>((resolve, reject) => {
          const entry = (): void => {
            if (signal) signal.removeEventListener("abort", onAbort);
            resolve();
          };
          const onAbort = (): void => {
            const index = queue.indexOf(entry);
            if (index >= VALUE_0) queue.splice(index, 1);
            reject(createAbortError());
          };
          if (signal) signal.addEventListener("abort", onAbort, { once: true });
          queue.push(entry);
        });
        inheritedSlot = true; // slot handed over by the releasing call
      }
      if (!inheritedSlot) active++;
      try {
        return await fn();
      } finally {
        const next = queue.shift();
        if (next)
          next(); // transfer the slot; active count unchanged
        else active--;
      }
    },
  };
}
