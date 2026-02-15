import { z } from "zod";
import {
  ERROR_POLLING_INVALID_OPTIONS_PREFIX,
  ERROR_POLLING_MAX_INTERVAL,
  VALUE_0,
} from "./constants";
import { raceWithTimeout } from "./race-with-timeout";

export const PollingOptionsSchema = z.object({
  initialIntervalMs: z.number().positive(),
  maxIntervalMs: z.number().positive(),
  backoffFactor: z.number().positive().optional().default(1.5),
  maxAttempts: z.number().positive().optional(),
});

export type PollingOptionsBase = z.infer<typeof PollingOptionsSchema>;

export interface PollingOptions<T> extends PollingOptionsBase {
  /** Optional timeout per poll; if pollFn exceeds this, onError is called and next run is scheduled. */
  pollTimeoutMs?: number;
  /** Optional AbortSignal; when aborted, polling stops (stop() is called). */
  signal?: AbortSignal;
  stopCondition?: (result: T) => boolean;
  onError?: (error: Error) => void;
  onSuccess?: (result: T) => void;
}

export interface PollingState {
  isPolling: boolean;
  currentIntervalMs: number;
  attemptCount: number;
  lastPollTime: number | null;
  lastError: Error | null;
}

export class PollingManager<T> {
  private readonly pollFn: () => Promise<T>;
  private readonly config: {
    initialIntervalMs: number;
    maxIntervalMs: number;
    backoffFactor: number;
    maxAttempts?: number;
    pollTimeoutMs?: number;
    signal?: AbortSignal;
    stopCondition?: (result: T) => boolean;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
  };
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  private abortListener: (() => void) | null = null;
  private state: PollingState = {
    isPolling: false,
    currentIntervalMs: VALUE_0,
    attemptCount: VALUE_0,
    lastPollTime: null,
    lastError: null,
  };

  constructor(pollFn: () => Promise<T>, options: PollingOptions<T>) {
    const baseValidation = PollingOptionsSchema.safeParse({
      initialIntervalMs: options.initialIntervalMs,
      maxIntervalMs: options.maxIntervalMs,
      backoffFactor: options.backoffFactor,
      maxAttempts: options.maxAttempts,
    });

    if (!baseValidation.success) {
      throw new Error(ERROR_POLLING_INVALID_OPTIONS_PREFIX + baseValidation.error.message);
    }

    if (options.maxIntervalMs < options.initialIntervalMs) {
      throw new Error(ERROR_POLLING_MAX_INTERVAL);
    }

    this.pollFn = pollFn;
    this.state.currentIntervalMs = options.initialIntervalMs;
    this.config = {
      initialIntervalMs: options.initialIntervalMs,
      maxIntervalMs: options.maxIntervalMs,
      backoffFactor: baseValidation.data.backoffFactor,
      maxAttempts: options.maxAttempts,
      pollTimeoutMs: options.pollTimeoutMs,
      signal: options.signal,
      stopCondition: options.stopCondition,
      onError: options.onError,
      onSuccess: options.onSuccess,
    };
  }

  start(): void {
    if (this.state.isPolling) {
      return;
    }
    if (this.config.signal?.aborted) {
      return;
    }

    this.state = {
      ...this.state,
      isPolling: true,
      currentIntervalMs: this.config.initialIntervalMs,
      attemptCount: VALUE_0,
      lastError: null,
    };
    if (this.config.signal) {
      this.abortListener = () => this.stop();
      this.config.signal.addEventListener("abort", this.abortListener);
    }
    this.scheduleNext();
  }

  stop(): void {
    if (this.config.signal && this.abortListener) {
      this.config.signal.removeEventListener("abort", this.abortListener);
      this.abortListener = null;
    }
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.state.isPolling = false;
  }

  getIsPolling(): boolean {
    return this.state.isPolling;
  }

  getState(): Readonly<PollingState> {
    return { ...this.state };
  }

  reset(): void {
    this.state.currentIntervalMs = this.config.initialIntervalMs;
    this.state.attemptCount = VALUE_0;
  }

  private scheduleNext(): void {
    if (!this.state.isPolling) {
      return;
    }
    if (this.config.signal?.aborted) {
      this.stop();
      return;
    }

    if (this.config.maxAttempts && this.state.attemptCount >= this.config.maxAttempts) {
      this.stop();
      return;
    }

    this.intervalId = setTimeout(async () => {
      if (!this.state.isPolling) {
        return;
      }
      if (this.config.signal?.aborted) {
        this.stop();
        return;
      }

      this.state.attemptCount += 1;
      this.state.lastPollTime = Date.now();

      try {
        const pollPromise = this.pollFn();
        const result =
          this.config.pollTimeoutMs !== undefined
            ? await raceWithTimeout(
                pollPromise,
                this.config.pollTimeoutMs,
                new Error(`Poll timed out after ${this.config.pollTimeoutMs}ms`),
              )
            : await pollPromise;
        this.state.lastError = null;

        this.config.onSuccess?.(result);

        if (this.config.stopCondition?.(result)) {
          this.stop();
          return;
        }

        this.state.currentIntervalMs = Math.min(
          this.state.currentIntervalMs * this.config.backoffFactor,
          this.config.maxIntervalMs,
        );
        this.scheduleNext();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.state.lastError = err;

        this.config.onError?.(err);

        this.state.currentIntervalMs = Math.min(
          this.state.currentIntervalMs * this.config.backoffFactor,
          this.config.maxIntervalMs,
        );
        this.scheduleNext();
      }
    }, this.state.currentIntervalMs);
  }
}
