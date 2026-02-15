/**
 * Options for a single HTTP request (timeout, signal, headers).
 */
export interface HttpRequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
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
}

/**
 * Fetch-compatible function type (global fetch or injected for tests).
 */
export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
