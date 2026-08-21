import { ERROR_WAIT_MUST_BE_NON_NEGATIVE_SUFFIX, VALUE_0 } from "./constants";

export interface CancellableFunction<TArgs extends unknown[], TReturn = void> {
  (...args: TArgs): TReturn | undefined;
  /** Cancel any pending invocation and reset internal state. */
  cancel: () => void;
  /** Immediately invoke a pending trailing call; returns the last result. */
  flush: () => TReturn | undefined;
  /** True while an invocation is scheduled. */
  pending: () => boolean;
}

export interface DebounceOptions {
  /** Invoke on the leading edge of the wait window. Default false. */
  leading?: boolean;
  /** Invoke on the trailing edge of the wait window. Default true. */
  trailing?: boolean;
  /**
   * Maximum time func is allowed to be delayed before it is force-invoked.
   * Prevents starvation under continuous calls. Same semantics as lodash.
   */
  maxWait?: number;
  /** Abort to cancel any pending invocation and disable the wrapper. */
  signal?: AbortSignal;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
  /** Abort to cancel any pending invocation and disable the wrapper. */
  signal?: AbortSignal;
}

function validateWait(wait: number, name: string): void {
  if (typeof wait !== "number" || wait < VALUE_0 || !Number.isFinite(wait)) {
    throw new Error(name + ERROR_WAIT_MUST_BE_NON_NEGATIVE_SUFFIX);
  }
}

interface CoreOptions {
  leading: boolean;
  trailing: boolean;
  maxWait?: number;
  signal?: AbortSignal;
}

/**
 * Shared engine for debounce/throttle (lodash algorithm).
 * Guarantees:
 *  - trailing edge always fires with the LATEST args/this provided
 *  - `this` and return values are preserved (last result is cached)
 *  - maxWait bounds total delay under continuous calls
 */
function createRateLimited<TArgs extends unknown[], TReturn>(
  func: (...args: TArgs) => TReturn,
  wait: number,
  opts: CoreOptions,
): CancellableFunction<TArgs, TReturn> {
  const { leading, trailing, signal } = opts;
  const maxing = opts.maxWait !== undefined;
  const maxWait = maxing ? Math.max(opts.maxWait as number, wait) : VALUE_0;

  let lastArgs: TArgs | undefined;
  let lastThis: unknown;
  let result: TReturn | undefined;
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = VALUE_0;

  function invokeFunc(time: number): TReturn | undefined {
    const args = lastArgs as TArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function shouldInvoke(time: number): boolean {
    if (lastCallTime === undefined) return true;
    const sinceCall = time - lastCallTime;
    const sinceInvoke = time - lastInvokeTime;
    return (
      sinceCall >= wait ||
      sinceCall < VALUE_0 || // system clock moved backwards
      (maxing && sinceInvoke >= maxWait)
    );
  }

  function remainingWait(time: number): number {
    const sinceCall = time - (lastCallTime as number);
    const sinceInvoke = time - lastInvokeTime;
    const waiting = wait - sinceCall;
    return maxing ? Math.min(waiting, maxWait - sinceInvoke) : waiting;
  }

  function trailingEdge(time: number): TReturn | undefined {
    timerId = undefined;
    // Only invoke if we have lastArgs, i.e. func was called at least once
    // since the last invocation (matches lodash trailing semantics).
    if (trailing && lastArgs !== undefined) return invokeFunc(time);
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function leadingEdge(time: number): TReturn | undefined {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  const cancel = (): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    lastInvokeTime = VALUE_0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
  };

  const flush = (): TReturn | undefined =>
    timerId === undefined ? result : trailingEdge(Date.now());

  function rateLimited(this: unknown, ...args: TArgs): TReturn | undefined {
    if (signal?.aborted) return result;
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) return leadingEdge(time);
      if (maxing) {
        // Handle invocations in a tight loop under maxWait.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(time);
      }
    }
    if (timerId === undefined) timerId = setTimeout(timerExpired, wait);
    return result;
  }

  rateLimited.cancel = cancel;
  rateLimited.flush = flush;
  rateLimited.pending = (): boolean => timerId !== undefined;

  if (signal) {
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
  }

  return rateLimited;
}

/**
 * Debounce: delay invoking `func` until `wait` ms have elapsed since the last
 * call. Trailing by default; supports leading/trailing edges, maxWait
 * (starvation guard) and AbortSignal cancellation. Preserves `this`, invokes
 * with the latest args, and returns/caches the last invocation result.
 */
export function debounce<TArgs extends unknown[], TReturn = void>(
  func: (...args: TArgs) => TReturn,
  wait: number,
  options: DebounceOptions = {},
): CancellableFunction<TArgs, TReturn> {
  validateWait(wait, "debounce");
  if (options.maxWait !== undefined) validateWait(options.maxWait, "debounce");
  return createRateLimited(func, wait, {
    leading: options.leading === true,
    trailing: options.trailing !== false,
    maxWait: options.maxWait,
    signal: options.signal,
  });
}

/**
 * Throttle: invoke `func` at most once per `wait` ms. Leading+trailing by
 * default. The trailing invocation always receives the LATEST arguments
 * provided during the window. Built on the debounce engine with
 * maxWait === wait (the canonical lodash construction).
 */
export function throttle<TArgs extends unknown[], TReturn = void>(
  func: (...args: TArgs) => TReturn,
  wait: number,
  options: ThrottleOptions = {},
): CancellableFunction<TArgs, TReturn> {
  validateWait(wait, "throttle");
  return createRateLimited(func, wait, {
    leading: options.leading !== false,
    trailing: options.trailing !== false,
    maxWait: wait,
    signal: options.signal,
  });
}
