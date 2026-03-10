/**
 * Default retryable statuses: 408 Request Timeout, 429 Too Many Requests, 5xx server errors.
 */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}
