import { fetchWithRetry as httpFetchWithRetry } from "@simpill/http.utils";
import { ApiTimeoutError } from "../shared/errors";
import { TIMEOUT_MS_5000 } from "../shared/internal-constants";
import type { RetryOptions } from "../shared/types";
import { composeSignals } from "./signal";

function noRetryableStatus(): boolean {
  return false;
}

/** A user abort must never be retried, even when the signal isn't threaded through. */
function notUserAbort(err: Error): boolean {
  return err.name !== "AbortError";
}

/**
 * Fetch with retries. Delegates to @simpill/http.utils fetchWithRetry.
 *
 * v1 behavior preserved by default: retry only on thrown (network) errors,
 * fixed delay, maxRetries=3 / delayMs=100. Fixed vs v1 (via http.utils):
 * - user aborts are never retried (v1 burned every retry + delay on an
 *   already-aborted signal)
 * - retry delays are abort-aware (reject mid-wait instead of sleeping on)
 * Opt-in: `policy` merges an @simpill/http.utils HttpRetryPolicy over the
 * mapped defaults — status-based retries, exponential backoff
 * (backoffMultiplier), full jitter, Retry-After honoring, retryMethods.
 * Note: with status-based retries enabled, exhausting attempts on a
 * retryable status throws (http.utils semantics) rather than returning the
 * final response.
 */
export async function fetchWithRetry(
  input: URL | string,
  init?: RequestInit,
  options: RetryOptions & { fetcher?: typeof fetch } = {}
): Promise<Response> {
  const { maxRetries = 3, delayMs = 100, fetcher = fetch, policy } = options;
  return httpFetchWithRetry(input, init, {
    retry: {
      maxAttempts: maxRetries + 1,
      delayMs,
      retryableStatuses: noRetryableStatus,
      retryableErrors: notUserAbort,
      ...policy,
    },
    fetch: fetcher,
  });
}

/**
 * Fetch with timeout. Uses optional custom fetcher; defaults to global fetch.
 *
 * v1 bug fixed: `signal: init?.signal ?? controller.signal` meant that
 * passing ANY signal silently disabled the timeout entirely — the timer still
 * ran and aborted a controller nobody was listening to. Now:
 * - no init.signal: the timeout aborts the request (as before), but with an
 *   ApiTimeoutError reason (name "TimeoutError") so timeouts are
 *   distinguishable from user aborts
 * - init.signal present + composeSignal: true (DEFAULT): the caller's signal
 *   and the timeout signal are composed, so the timeout CANCELS the request,
 *   AND the returned promise is raced against the timer. Both halves matter:
 *   composing alone only REQUESTS cancellation, so a fetcher that ignores its
 *   signal would never settle; racing alone leaves the request running after
 *   the caller has given up. The fetcher receives a derived signal object.
 * - init.signal present + composeSignal: false: the caller's signal is passed
 *   through IDENTICALLY and the timeout is enforced by the race alone, so the
 *   underlying request cannot be cancelled and keeps running. Opt out only
 *   when a caller must receive its own signal object by identity.
 */
export async function fetchWithTimeout(
  input: URL | string,
  init?: RequestInit,
  options: { timeoutMs?: number; fetcher?: typeof fetch; composeSignal?: boolean } = {}
): Promise<Response> {
  const { timeoutMs = TIMEOUT_MS_5000, fetcher = fetch, composeSignal = true } = options;

  if (init?.signal && !composeSignal) {
    // Back-compat path: pass the caller's signal through untouched, enforce
    // the timeout by racing the promise.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      // Deliberately NOT unref'd: if this timer were unref'd and the fetcher
      // never held the event loop, Node could exit before the race settles.
      timer = setTimeout(() => reject(new ApiTimeoutError(timeoutMs)), timeoutMs);
    });
    const request = fetcher(input, init);
    request.catch(() => undefined);
    try {
      return await Promise.race([request, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  const controller = new AbortController();
  const signal = init?.signal ? composeSignals(init.signal, controller.signal) : controller.signal;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    // Not unref'd for the same reason as the race path above.
    timer = setTimeout(() => {
      const err = new ApiTimeoutError(timeoutMs);
      controller.abort(err);
      reject(err);
    }, timeoutMs);
  });
  const request = fetcher(input, { ...init, signal });
  // Whichever loses the race still settles; without this its rejection (typically
  // the abort we just triggered) would surface as an unhandled rejection.
  request.catch(() => undefined);
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
