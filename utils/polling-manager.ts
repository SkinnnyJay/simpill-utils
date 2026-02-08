/**
 * Polling Manager Utility
 *
 * Generic polling manager with exponential backoff and automatic stop conditions.
 * Provides efficient polling with configurable intervals and stop conditions.
 *
 * This is a browser-safe version that uses console logging.
 */

import { z } from "zod";

// ============================================================================
// Zod Schema for Options
// ============================================================================

export const PollingOptionsSchema = z.object({
  /** Initial polling interval in milliseconds */
  initialIntervalMs: z.number().positive(),
  /** Maximum polling interval in milliseconds */
  maxIntervalMs: z.number().positive(),
  /** Backoff multiplier (default: 1.5) */
  backoffFactor: z.number().positive().optional().default(1.5),
  /** Maximum number of poll attempts (optional) */
  maxAttempts: z.number().positive().optional(),
});

export type PollingOptionsBase = z.infer<typeof PollingOptionsSchema>;

/**
 * Full polling options including callbacks (not validated by Zod)
 */
export interface PollingOptions<T> extends PollingOptionsBase {
  /** Condition to stop polling */
  stopCondition?: (result: T) => boolean;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler called on each successful poll */
  onSuccess?: (result: T) => void;
}

// ============================================================================
// Polling State
// ============================================================================

export interface PollingState {
  isPolling: boolean;
  currentIntervalMs: number;
  attemptCount: number;
  lastPollTime: number | null;
  lastError: Error | null;
}

// ============================================================================
// Polling Manager Class
// ============================================================================

/**
 * Polling Manager with exponential backoff
 *
 * Features:
 * - Exponential backoff between polls
 * - Automatic stop when condition met or max attempts reached
 * - Manual start/stop control
 * - Error handling with optional callback
 * - Observable state
 *
 * @example
 * ```typescript
 * const poller = new PollingManager(
 *   () => fetchStatus(),
 *   {
 *     initialIntervalMs: 1000,
 *     maxIntervalMs: 30000,
 *     stopCondition: (status) => status === 'complete',
 *     onSuccess: (status) => updateUI(status),
 *     onError: (err) => showError(err),
 *   }
 * );
 *
 * poller.start();
 * // Later: poller.stop();
 * ```
 */
export class PollingManager<T> {
  private readonly pollFn: () => Promise<T>;
  private readonly config: {
    initialIntervalMs: number;
    maxIntervalMs: number;
    backoffFactor: number;
    maxAttempts?: number;
    stopCondition?: (result: T) => boolean;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
  };
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  private state: PollingState = {
    isPolling: false,
    currentIntervalMs: 0,
    attemptCount: 0,
    lastPollTime: null,
    lastError: null,
  };

  constructor(pollFn: () => Promise<T>, options: PollingOptions<T>) {
    // Validate base options with Zod
    const baseValidation = PollingOptionsSchema.safeParse({
      initialIntervalMs: options.initialIntervalMs,
      maxIntervalMs: options.maxIntervalMs,
      backoffFactor: options.backoffFactor,
      maxAttempts: options.maxAttempts,
    });

    if (!baseValidation.success) {
      throw new Error(`Invalid polling options: ${baseValidation.error.message}`);
    }

    // Additional validation
    if (options.maxIntervalMs < options.initialIntervalMs) {
      throw new Error("maxIntervalMs must be >= initialIntervalMs");
    }

    this.pollFn = pollFn;
    this.state.currentIntervalMs = options.initialIntervalMs;
    this.config = {
      initialIntervalMs: options.initialIntervalMs,
      maxIntervalMs: options.maxIntervalMs,
      backoffFactor: baseValidation.data.backoffFactor,
      maxAttempts: options.maxAttempts,
      stopCondition: options.stopCondition,
      onError: options.onError,
      onSuccess: options.onSuccess,
    };
  }

  /**
   * Start polling
   */
  start(): void {
    if (this.state.isPolling) {
      return; // Already polling
    }

    this.state = {
      ...this.state,
      isPolling: true,
      currentIntervalMs: this.config.initialIntervalMs,
      attemptCount: 0,
      lastError: null,
    };
    this.scheduleNext();
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.state.isPolling = false;
  }

  /**
   * Check if currently polling
   */
  getIsPolling(): boolean {
    return this.state.isPolling;
  }

  /**
   * Get current polling state (readonly snapshot)
   */
  getState(): Readonly<PollingState> {
    return { ...this.state };
  }

  /**
   * Reset to initial interval (useful after receiving new data)
   */
  reset(): void {
    this.state.currentIntervalMs = this.config.initialIntervalMs;
    this.state.attemptCount = 0;
  }

  /**
   * Schedule next poll
   */
  private scheduleNext(): void {
    if (!this.state.isPolling) {
      return;
    }

    // Check max attempts
    if (this.config.maxAttempts && this.state.attemptCount >= this.config.maxAttempts) {
      this.stop();
      return;
    }

    this.intervalId = setTimeout(async () => {
      if (!this.state.isPolling) {
        return;
      }

      this.state.attemptCount++;
      this.state.lastPollTime = Date.now();

      try {
        const result = await this.pollFn();
        this.state.lastError = null;

        // Call success handler
        this.config.onSuccess?.(result);

        // Check stop condition
        if (this.config.stopCondition?.(result)) {
          this.stop();
          return;
        }

        // Schedule next poll with backoff
        this.state.currentIntervalMs = Math.min(
          this.state.currentIntervalMs * this.config.backoffFactor,
          this.config.maxIntervalMs
        );
        this.scheduleNext();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.state.lastError = err;

        if (this.config.onError) {
          this.config.onError(err);
        } else {
          console.error("[PollingManager] Poll error", error);
        }

        // Continue polling even on error (with backoff)
        this.state.currentIntervalMs = Math.min(
          this.state.currentIntervalMs * this.config.backoffFactor,
          this.config.maxIntervalMs
        );
        this.scheduleNext();
      }
    }, this.state.currentIntervalMs);
  }
}
