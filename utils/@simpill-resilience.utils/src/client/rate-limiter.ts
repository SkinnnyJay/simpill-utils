import type { Gate, RunOptions } from "@simpill/async.utils";
import type { RateLimiterOptions } from "../shared";
import { VALUE_0 } from "../shared/constants";
import { abortableDelay, throwIfAborted } from "../shared/errors";

/**
 * In-memory fixed-window rate limiter. run(fn) waits until under the limit,
 * then runs fn. Waiting is abort-aware: aborting the signal rejects the wait
 * immediately instead of sleeping out the remainder of the window.
 *
 * Note: fixed windows permit up to 2x maxRequests across a window boundary.
 * If that matters for your downstream, use TokenBucketRateLimiter.
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
    throwIfAborted(options?.signal);
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }
    if (this.count >= this.maxRequests) {
      const wait = this.windowMs - (now - this.windowStart);
      if (wait > VALUE_0) await abortableDelay(wait, options?.signal);
      throwIfAborted(options?.signal);
      return this.run(fn, options);
    }
    this.count++;
    return fn();
  }
}
