import { delay, type Gate, type RunOptions } from "@simpill/async.utils";
import type { RateLimiterOptions } from "../shared";
import { ERROR_NAME_ABORT, ERROR_OPERATION_ABORTED, VALUE_0 } from "../shared/constants";

/**
 * In-memory fixed-window rate limiter. run(fn) waits until under the limit, then runs fn.
 */
export class RateLimiter implements Gate {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private windowStart = 0;
  private count = 0;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    if (options?.signal?.aborted) {
      const error = new Error(ERROR_OPERATION_ABORTED);
      error.name = ERROR_NAME_ABORT;
      throw error;
    }
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }
    if (this.count >= this.maxRequests) {
      const wait = this.windowMs - (now - this.windowStart);
      if (wait > VALUE_0) await delay(wait);
      if (options?.signal?.aborted) {
        const error = new Error(ERROR_OPERATION_ABORTED);
        error.name = ERROR_NAME_ABORT;
        throw error;
      }
      return this.run(fn, options);
    }
    this.count++;
    return fn();
  }
}
