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
      signal: init?.signal ?? controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}
