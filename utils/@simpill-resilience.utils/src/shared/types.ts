export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  openMs?: number;
  halfOpenMaxCalls?: number;
  /** Optional callback when state changes (e.g. for metrics/logging). */
  onStateChange?: (state: CircuitState, previousState: CircuitState) => void;
}

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export interface BulkheadOptions {
  maxConcurrency: number;
}
