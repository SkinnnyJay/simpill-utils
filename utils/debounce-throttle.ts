/**
 * Debounce and Throttle Utilities
 *
 * Pure functions for optimizing frequent updates.
 * Runtime-agnostic (works in browser and Node.js).
 *
 * For React hooks, use @/lib/client/hooks instead.
 */

import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

/**
 * Generic function type for debounce/throttle
 */
export type AnyFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn;

/**
 * Debounced/throttled function with cancel capability
 */
export interface CancellableFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  /** Cancel any pending execution */
  cancel: () => void;
  /** Flush pending execution immediately */
  flush: () => void;
  /** Check if there's a pending execution */
  pending: () => boolean;
}

// ============================================================================
// Validation
// ============================================================================

const WaitTimeSchema = z.number().nonnegative().finite();

function validateWaitTime(wait: number, functionName: string): void {
  const result = WaitTimeSchema.safeParse(wait);
  if (!result.success) {
    throw new Error(`${functionName}: wait must be a non-negative finite number, got ${wait}`);
  }
}

// ============================================================================
// Debounce
// ============================================================================

/**
 * Debounce function - delays execution until after wait time has passed
 * with no new calls.
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function with cancel/flush capabilities
 *
 * @example
 * ```typescript
 * const debouncedSave = debounce(save, 300);
 * debouncedSave(data); // Will execute after 300ms of no calls
 * debouncedSave.cancel(); // Cancel pending execution
 * ```
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): CancellableFunction<TArgs> {
  validateWaitTime(wait, "debounce");

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: TArgs | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const args = lastArgs;
      lastArgs = null;
      func(...args);
    }
  };

  const pending = (): boolean => timeoutId !== null;

  const debounced = (...args: TArgs): void => {
    lastArgs = args;
    cancel();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastArgs = null;
      func(...args);
    }, wait);
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

// ============================================================================
// Throttle
// ============================================================================

export interface ThrottleOptions {
  /** Execute on the leading edge (default: true) */
  leading?: boolean;
  /** Execute on the trailing edge (default: true) */
  trailing?: boolean;
}

/**
 * Throttle function - limits execution to at most once per wait time.
 *
 * @param func - Function to throttle
 * @param wait - Wait time in milliseconds
 * @param options - Throttle options
 * @returns Throttled function with cancel/flush capabilities
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number,
  options: ThrottleOptions = {}
): CancellableFunction<TArgs> {
  validateWaitTime(wait, "throttle");

  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastArgs: TArgs | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const args = lastArgs;
      lastArgs = null;
      lastCallTime = Date.now();
      func(...args);
    }
  };

  const pending = (): boolean => timeoutId !== null;

  const throttled = (...args: TArgs): void => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // First call or enough time has passed
    if (lastCallTime === 0 && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - timeSinceLastCall;

    if (remaining <= 0 || remaining > wait) {
      // Clear any existing timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      func(...args);
    } else if (trailing && timeoutId === null) {
      // Schedule trailing call
      lastArgs = args;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCallTime = leading ? Date.now() : 0;
        if (lastArgs !== null) {
          const savedArgs = lastArgs;
          lastArgs = null;
          func(...savedArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = cancel;
  throttled.flush = flush;
  throttled.pending = pending;

  return throttled;
}
