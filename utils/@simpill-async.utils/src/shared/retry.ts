import { ERROR_RETRY_FAILED, VALUE_0, VALUE_1, VALUE_3 } from "./constants";

/** Options for retry: maxAttempts, delayMs, backoffMultiplier, onRetry. */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/** Retry an async function with optional backoff; throws last error after all attempts fail. */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? VALUE_3;
  const delayMs = options.delayMs ?? VALUE_0;
  const backoffMultiplier = options.backoffMultiplier ?? VALUE_1;
  const onRetry = options.onRetry;

  let lastError: Error | undefined;
  let wait = delayMs;

  for (let attempt = VALUE_1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        onRetry?.(lastError, attempt);
        if (wait > VALUE_0) {
          await new Promise<void>((r) => setTimeout(r, wait));
        }
        wait *= backoffMultiplier;
      } else {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error(ERROR_RETRY_FAILED);
}
