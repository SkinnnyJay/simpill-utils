import type { Gate, RunOptions } from "@simpill/async.utils";
import type { CircuitBreakerOptions, CircuitState } from "../shared";
import {
  CIRCUIT_BREAKER_DEFAULT_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_DEFAULT_HALF_OPEN_MAX_CALLS,
  CIRCUIT_BREAKER_DEFAULT_OPEN_MS,
  CIRCUIT_BREAKER_DEFAULT_SUCCESS_THRESHOLD,
  CIRCUIT_BREAKER_ERROR,
  CLOSED,
  ERROR_NAME_ABORT,
  ERROR_OPERATION_ABORTED,
  HALF_OPEN,
  OPEN,
} from "../shared/constants";

export type { CircuitState } from "../shared";

export class CircuitBreaker implements Gate {
  private state: CircuitState = CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private halfOpenCalls = 0;
  private openUntil = 0;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly openMs: number;
  private readonly halfOpenMaxCalls: number;
  private readonly onStateChange?: (state: CircuitState, previousState: CircuitState) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? CIRCUIT_BREAKER_DEFAULT_FAILURE_THRESHOLD;
    this.successThreshold = options.successThreshold ?? CIRCUIT_BREAKER_DEFAULT_SUCCESS_THRESHOLD;
    this.openMs = options.openMs ?? CIRCUIT_BREAKER_DEFAULT_OPEN_MS;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls ?? CIRCUIT_BREAKER_DEFAULT_HALF_OPEN_MAX_CALLS;
    this.onStateChange = options.onStateChange;
  }

  private setState(next: CircuitState): void {
    if (next === this.state) return;
    const previous = this.state;
    this.state = next;
    this.onStateChange?.(next, previous);
  }

  getState(): CircuitState {
    if (this.state === OPEN && Date.now() >= this.openUntil) {
      this.setState(HALF_OPEN);
      this.halfOpenCalls = 0;
      this.successCount = 0;
    }
    return this.state;
  }

  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    if (options?.signal?.aborted) {
      const error = new Error(ERROR_OPERATION_ABORTED);
      error.name = ERROR_NAME_ABORT;
      throw error;
    }
    const state = this.getState();
    if (state === OPEN) {
      throw new Error(CIRCUIT_BREAKER_ERROR.OPEN);
    }
    if (state === HALF_OPEN && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new Error(CIRCUIT_BREAKER_ERROR.HALF_OPEN_MAX_CALLS);
    }

    if (this.state === HALF_OPEN) this.halfOpenCalls++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  private recordSuccess(): void {
    if (this.state === HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.setState(CLOSED);
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private recordFailure(): void {
    if (this.state === HALF_OPEN) {
      this.openUntil = Date.now() + this.openMs;
      this.setState(OPEN);
      return;
    }
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.openUntil = Date.now() + this.openMs;
      this.setState(OPEN);
    }
  }
}
