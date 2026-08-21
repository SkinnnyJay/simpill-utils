import {
  ERROR_NAME_ABORT,
  ERROR_OPERATION_ABORTED,
  ERROR_RETRY_DEADLINE_EXCEEDED,
  ERROR_RETRY_FAILED,
  VALUE_0,
  VALUE_1,
  VALUE_3,
} from "./constants";
import { delay } from "./delay";

/** Backoff jitter strategy (AWS "Exponential Backoff And Jitter", Brooker 2015). */
export type RetryJitter = "none" | "full" | "decorrelated";

/**
 * Options for retry.
 * - maxAttempts: total attempts including the first (default 3)
 * - delayMs: base delay before the first retry (default 0)
 * - backoffMultiplier: exponential growth factor per retry (default 1)
 * - maxDelayMs: hard cap on any single computed delay
 * - jitter: "none" (default, legacy behavior), "full" (uniform 0..delay),
 *   or "decorrelated" (uniform base..prevDelay*3, capped)
 * - maxRetryTimeMs: total time budget across all attempts + waits, measured
 *   with a monotonic clock; when exceeded the last error is thrown
 * - signal: AbortSignal; aborting rejects immediately (during waits too)
 * - shouldRetry: return false to stop retrying and rethrow the error
 * - unref: unref delay timers so pending retries never keep Node alive
 * - onRetry: called before each wait with the failed attempt's error
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  jitter?: RetryJitter;
  maxRetryTimeMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  unref?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const monotonicNow = (): number =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  const error = new Error(String(err));
  // Preserve the original thrown value (Node >=16.9 exposes this as error.cause).
  (error as Error & { cause?: unknown }).cause = err;
  return error;
};

const createSignalAbortError = (signal?: AbortSignal): Error => {
  const reason = signal?.reason;
  if (reason instanceof Error) return reason;
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

/** Compute the wait before the next retry (attempt is 1-based). */
const computeWait = (
  attempt: number,
  base: number,
  multiplier: number,
  cap: number,
  jitter: RetryJitter,
  prevWait: number,
): number => {
  const exponential = Math.min(cap, base * multiplier ** (attempt - VALUE_1));
  if (jitter === "full") {
    // AWS full jitter: sleep = random(0, min(cap, base * mult^attempt))
    return Math.random() * exponential;
  }
  if (jitter === "decorrelated") {
    // AWS decorrelated jitter: sleep = min(cap, random(base, prevSleep * 3))
    const prev = prevWait > VALUE_0 ? prevWait : base;
    return Math.min(cap, base + Math.random() * Math.max(VALUE_0, prev * VALUE_3 - base));
  }
  return exponential;
};

/**
 * Retry an async function with exponential backoff; throws the last error
 * after all attempts fail. Supports AWS-style jitter, a max-delay cap, a
 * total deadline (maxRetryTimeMs), AbortSignal cancellation, and a
 * shouldRetry predicate. Errors named "AbortError" are never retried.
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? VALUE_3;
  const delayMs = options.delayMs ?? VALUE_0;
  const backoffMultiplier = options.backoffMultiplier ?? VALUE_1;
  const maxDelayMs = options.maxDelayMs ?? Number.POSITIVE_INFINITY;
  const jitter = options.jitter ?? "none";
  const signal = options.signal;
  const onRetry = options.onRetry;
  const startedAt = options.maxRetryTimeMs !== undefined ? monotonicNow() : VALUE_0;

  const deadlineExceeded = (): boolean =>
    options.maxRetryTimeMs !== undefined && monotonicNow() - startedAt >= options.maxRetryTimeMs;

  let lastError: Error | undefined;
  let wait = VALUE_0;

  for (let attempt = VALUE_1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw createSignalAbortError(signal);
    try {
      return await fn();
    } catch (err) {
      lastError = toError(err);
      const retryable =
        attempt < maxAttempts &&
        lastError.name !== ERROR_NAME_ABORT &&
        !signal?.aborted &&
        !deadlineExceeded() &&
        (options.shouldRetry?.(lastError, attempt) ?? true);
      if (!retryable) throw lastError;

      onRetry?.(lastError, attempt);
      wait = computeWait(attempt, delayMs, backoffMultiplier, maxDelayMs, jitter, wait);
      if (options.maxRetryTimeMs !== undefined) {
        const remaining = options.maxRetryTimeMs - (monotonicNow() - startedAt);
        if (remaining <= VALUE_0) throw lastError;
        wait = Math.min(wait, remaining);
      }
      if (wait > VALUE_0) {
        await delay(wait, { signal, unref: options.unref });
      }
      if (deadlineExceeded() && attempt < maxAttempts) {
        throw lastError ?? new Error(ERROR_RETRY_DEADLINE_EXCEEDED);
      }
    }
  }

  throw lastError ?? new Error(ERROR_RETRY_FAILED);
}
