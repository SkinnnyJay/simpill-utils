import { fetchWithRetry as httpFetchWithRetry } from "@simpill/http.utils";
import { TIMEOUT_MS_5000 } from "../shared/internal-constants";
import type { RetryOptions } from "../shared/types";

function noRetryableStatus(): boolean {
  return false;
}

/**
 * Fetch with retries. Delegates to @simpill/http.utils fetchWithRetry.
 * Retries only on thrown errors (not on HTTP status codes) to preserve original semantics.
 * Uses optional custom fetcher; defaults to global fetch.
 */
export async function fetchWithRetry(
  input: URL | string,
  init?: RequestInit,
  options: RetryOptions & { fetcher?: typeof fetch } = {}
): Promise<Response> {
  const { maxRetries = 3, delayMs = 100, fetcher = fetch } = options;
  return httpFetchWithRetry(input, init, {
    retry: {
      maxAttempts: maxRetries + 1,
      delayMs,
      retryableStatuses: noRetryableStatus,
    },
    fetch: fetcher,
  });
}

/**
 * Fetch with timeout. Uses optional custom fetcher; defaults to global fetch.
 */
/** AbortSignal.any where available (Node >= 20.3), with a listener-based fallback. */
function combineSignals(caller: AbortSignal | null | undefined, timeout: AbortSignal): AbortSignal {
  if (!caller) return timeout;
  const anyOf = (AbortSignal as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyOf === "function") return anyOf([caller, timeout]);
  const merged = new AbortController();
  const abort = (): void => merged.abort();
  if (caller.aborted || timeout.aborted) merged.abort();
  else {
    caller.addEventListener("abort", abort, { once: true });
    timeout.addEventListener("abort", abort, { once: true });
  }
  return merged.signal;
}

export async function fetchWithTimeout(
  input: URL | string,
  init?: RequestInit,
  options: { timeoutMs?: number; fetcher?: typeof fetch } = {}
): Promise<Response> {
  const { timeoutMs = TIMEOUT_MS_5000, fetcher = fetch } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetcher(input, {
      ...init,
      // Combine rather than choose. `init.signal ?? controller.signal` meant that passing a
      // cancellation signal silently disabled the timeout: the timer still fired, but on a
      // controller nothing was listening to, so the request could hang forever.
      signal: combineSignals(init?.signal, controller.signal),
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}
