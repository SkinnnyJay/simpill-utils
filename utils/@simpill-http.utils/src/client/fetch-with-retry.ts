import { retry } from "@simpill/async.utils";
import type { FetchLike, HttpRetryPolicy } from "../shared";
import { ERROR_RETRYABLE_STATUS_PREFIX } from "../shared/constants";
import { isRetryableStatus } from "../shared/is-retryable";

export interface FetchWithRetryOptions {
  retry: HttpRetryPolicy;
  fetch?: FetchLike;
}

function defaultRetryableErrors(): boolean {
  return true;
}

/**
 * Fetch with retries. Retries on retryable status codes (default 408, 429, 5xx) or when
 * the request throws and retryableErrors returns true. Uses @simpill/async.utils retry.
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

  return retry(
    async () => {
      const response = await fetchFn(input, init);
      if (retryableStatuses(response.status)) {
        throw new Error(ERROR_RETRYABLE_STATUS_PREFIX + response.status);
      }
      return response;
    },
    {
      maxAttempts: policy.maxAttempts ?? 3,
      delayMs: policy.delayMs ?? 0,
      backoffMultiplier: policy.backoffMultiplier ?? 1,
      onRetry(err) {
        if (!retryableErrors(err)) {
          throw err;
        }
      },
    },
  );
}
