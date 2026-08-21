/**
 * Options for a single HTTP request (timeout, signal, headers, per-request retry).
 */
export interface HttpRequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Per-request retry policy; overrides the client's defaultRetry. */
  retry?: HttpRetryPolicy;
}

/**
 * Policy for retrying failed requests (status-based and error-based).
 */
export interface HttpRetryPolicy {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableStatuses?: (status: number) => boolean;
  retryableErrors?: (err: Error) => boolean;
  /** Per-attempt timeout in ms; a timed-out attempt is aborted and treated as a retryable error. */
  timeoutMs?: number;
  /** Honor Retry-After headers (delta-seconds or HTTP-date) on retryable responses. Default: true. */
  respectRetryAfter?: boolean;
  /** Upper bound for Retry-After waits in ms. Default: 30000 (mirrors undici RetryHandler maxTimeout). */
  maxRetryAfterMs?: number;
  /** Apply full jitter (uniform 0..delay) to backoff delays to avoid thundering herds. Default: false. */
  jitter?: boolean;
  /** If set, only these HTTP methods are retried (e.g. ["GET","PUT","HEAD","OPTIONS","DELETE"]); others fail fast. Default: retry all methods. */
  retryMethods?: string[];
}

/**
 * Fetch-compatible function type (global fetch or injected for tests).
 */
export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
