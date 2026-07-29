import type { FetchLike, HttpRetryPolicy } from "../shared";
import {
  ERROR_REQUEST_ABORTED,
  MAX_RETRY_AFTER_MS_DEFAULT,
  RETRY_DEFAULT_BACKOFF_MULTIPLIER,
  RETRY_DEFAULT_DELAY_MS,
  VALUE_0,
  VALUE_1,
  VALUE_3,
} from "../shared/constants";
import { RetryableStatusError } from "../shared/errors";
import { isRetryableStatus } from "../shared/is-retryable";
import { parseRetryAfterMs } from "../shared/retry-after";
import { fetchWithTimeout } from "./fetch-with-timeout";

export interface FetchWithRetryOptions {
  retry: HttpRetryPolicy;
  fetch?: FetchLike;
}

function defaultRetryableErrors(): boolean {
  return true;
}

function abortReason(signal: AbortSignal): Error {
  const reason: unknown = signal.reason;
  if (reason instanceof Error) return reason;
  if (reason !== undefined) return new Error(String(reason));
  return new Error(ERROR_REQUEST_ABORTED);
}

/** Sleep that rejects immediately (with the signal's reason) if the signal aborts. */
function abortableDelay(ms: number, signal: AbortSignal | null | undefined): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }
    let onAbort: (() => void) | null = null;
    const timer = setTimeout(() => {
      if (onAbort && signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    if (signal) {
      onAbort = () => {
        clearTimeout(timer);
        reject(abortReason(signal));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

/**
 * Fetch with retries. Retries on retryable status codes (default 408, 429, 5xx) or when
 * the request throws and retryableErrors returns true. Improvements over the naive loop:
 * - An aborted `init.signal` stops retrying immediately (delays are abort-aware too).
 * - Retry-After headers are honored by default (delta-seconds and HTTP-date), capped by
 *   `maxRetryAfterMs` (default 30s, mirroring undici RetryHandler).
 * - Discarded retryable responses have their bodies cancelled so connections are reused;
 *   the final failure throws RetryableStatusError carrying the intact Response.
 * - Optional per-attempt `timeoutMs`, full `jitter`, and a `retryMethods` idempotency guard.
 * - Requests with ReadableStream bodies are never retried (the stream is already consumed).
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchWithRetryOptions,
): Promise<Response> {
  const fetchFn = options?.fetch ?? fetch;
  const policy = options?.retry ?? {};
  const retryableStatuses = policy.retryableStatuses ?? isRetryableStatus;
  const retryableErrors = policy.retryableErrors ?? defaultRetryableErrors;
  const maxAttempts = policy.maxAttempts ?? VALUE_3;
  const backoffMultiplier = policy.backoffMultiplier ?? RETRY_DEFAULT_BACKOFF_MULTIPLIER;
  const respectRetryAfter = policy.respectRetryAfter ?? true;
  const maxRetryAfterMs = policy.maxRetryAfterMs ?? MAX_RETRY_AFTER_MS_DEFAULT;
  const signal = init?.signal ?? null;
  const method = (init?.method ?? "GET").toUpperCase();
  const methodAllowed = policy.retryMethods
    ? policy.retryMethods.some((m) => m.toUpperCase() === method)
    : true;
  const bodyIsStream =
    typeof ReadableStream !== "undefined" && init?.body instanceof ReadableStream;
  const canRetry = methodAllowed && !bodyIsStream;

  let wait = policy.delayMs ?? RETRY_DEFAULT_DELAY_MS;
  let lastError: Error | undefined;

  for (let attempt = VALUE_1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw abortReason(signal);
    let retryAfterMs: number | undefined;
    try {
      const response =
        policy.timeoutMs != null && policy.timeoutMs > VALUE_0
          ? await fetchWithTimeout(input, { ...(init ?? {}), timeoutMs: policy.timeoutMs }, fetchFn)
          : await fetchFn(input, init);
      if (!retryableStatuses(response.status)) return response;
      const isFinal = attempt >= maxAttempts || !canRetry;
      if (!isFinal) {
        if (respectRetryAfter) {
          retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
          if (retryAfterMs !== undefined) retryAfterMs = Math.min(retryAfterMs, maxRetryAfterMs);
        }
        // Discard the body so the underlying connection is released for the next attempt.
        void response.body?.cancel().catch(() => {});
      }
      throw new RetryableStatusError(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;
      if (signal?.aborted) throw abortReason(signal);
      if (attempt >= maxAttempts || !canRetry) throw error;
      if (!retryableErrors(error)) throw error;
      const base = wait;
      wait *= backoffMultiplier;
      let delay = policy.jitter ? Math.random() * base : base;
      if (retryAfterMs !== undefined) delay = Math.max(delay, retryAfterMs);
      if (delay > VALUE_0) await abortableDelay(delay, signal);
    }
  }

  throw lastError ?? new Error(ERROR_REQUEST_ABORTED);
}
