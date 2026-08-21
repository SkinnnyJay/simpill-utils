import { ERROR_RETRYABLE_STATUS_PREFIX } from "./constants";

/**
 * Thrown when a request exceeds its timeout. `name` is "TimeoutError" to match
 * the `AbortSignal.timeout()` convention, so callers can branch on `err.name`.
 */
export class HttpTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when a response has a retryable status. Message keeps the historic
 * "Retryable status: <code>" text for backward compatibility, but callers now
 * also get the status code and the final Response (body intact on the last attempt).
 */
export class RetryableStatusError extends Error {
  readonly status: number;
  readonly response: Response;

  constructor(response: Response) {
    super(ERROR_RETRYABLE_STATUS_PREFIX + response.status);
    this.name = "RetryableStatusError";
    this.status = response.status;
    this.response = response;
  }
}
