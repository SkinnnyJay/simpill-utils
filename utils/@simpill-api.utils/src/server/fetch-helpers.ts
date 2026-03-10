import { TIMEOUT_MS_5000, VALUE_0 } from "../shared/internal-constants";
import type { RetryOptions } from "../shared/types";

/**
 * Fetch with retries. Uses optional custom fetcher; defaults to global fetch.
 */
export async function fetchWithRetry(
  input: URL | string,
  init?: RequestInit,
  options: RetryOptions & { fetcher?: typeof fetch } = {}
): Promise<Response> {
  const { maxRetries = 3, delayMs = 100, fetcher = fetch } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetcher(input, init);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && delayMs > VALUE_0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
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
