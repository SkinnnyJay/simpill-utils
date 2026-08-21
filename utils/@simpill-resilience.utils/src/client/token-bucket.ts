import type { Gate, RunOptions } from "@simpill/async.utils";
import type { TokenBucketOptions } from "../shared";
import { ERROR_TOKEN_BUCKET_OPTIONS, MS_PER_SECOND, VALUE_0, VALUE_1 } from "../shared/constants";
import { abortableDelay, throwIfAborted } from "../shared/errors";

/**
 * In-memory token bucket rate limiter (Gate-compatible).
 *
 * Enforces a sustained rate (refillPerSecond) while allowing bursts up to
 * `capacity`. Unlike a fixed window, a token bucket cannot be tricked into
 * admitting 2x the limit across a window boundary — admission is continuous.
 * run(fn) waits (abort-aware) until a token is available, then runs fn.
 */
export class TokenBucketRateLimiter implements Gate {
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private tokens: number;
  private lastRefill: number;

  constructor(options: TokenBucketOptions) {
    if (options.capacity < VALUE_1 || options.refillPerSecond <= VALUE_0) {
      throw new Error(ERROR_TOKEN_BUCKET_OPTIONS);
    }
    this.capacity = options.capacity;
    this.refillPerSecond = options.refillPerSecond;
    this.tokens = options.capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed <= VALUE_0) return;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + (elapsed / MS_PER_SECOND) * this.refillPerSecond,
    );
    this.lastRefill = now;
  }

  /** Take a token now if one is available (non-blocking). */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= VALUE_1) {
      this.tokens -= VALUE_1;
      return true;
    }
    return false;
  }

  /** Tokens currently available (after refill). */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    throwIfAborted(options?.signal);
    while (!this.tryAcquire()) {
      const deficitMs = ((VALUE_1 - this.tokens) / this.refillPerSecond) * MS_PER_SECOND;
      await abortableDelay(Math.max(VALUE_1, Math.ceil(deficitMs)), options?.signal);
    }
    return fn();
  }
}
