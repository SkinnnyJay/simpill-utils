import { ERROR_WAIT_MUST_BE_NON_NEGATIVE_SUFFIX, VALUE_0 } from "./constants";

export interface CancellableFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

function validateWait(wait: number, name: string): void {
  if (typeof wait !== "number" || wait < VALUE_0 || !Number.isFinite(wait)) {
    throw new Error(name + ERROR_WAIT_MUST_BE_NON_NEGATIVE_SUFFIX);
  }
}

export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number,
): CancellableFunction<TArgs> {
  validateWait(wait, "debounce");
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

  const debounced = (...args: TArgs): void => {
    cancel();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastArgs = null;
      func(...args);
    }, wait);
    lastArgs = args;
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = (): boolean => timeoutId !== null;
  return debounced;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number,
  options: ThrottleOptions = {},
): CancellableFunction<TArgs> {
  validateWait(wait, "throttle");
  const { leading = true, trailing = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = VALUE_0;
  let lastArgs: TArgs | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = VALUE_0;
    lastArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs !== null) {
      const args = lastArgs;
      lastArgs = null;
      lastCallTime = Date.now();
      func(...args);
    }
  };

  const throttled = (...args: TArgs): void => {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);
    if (lastCallTime === VALUE_0 && !leading) lastCallTime = now;
    if (remaining <= VALUE_0 || remaining > wait) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      func(...args);
    } else if (trailing && timeoutId === null) {
      lastArgs = args;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCallTime = leading ? Date.now() : VALUE_0;
        if (lastArgs !== null) {
          const a = lastArgs;
          lastArgs = null;
          func(...a);
        }
      }, remaining);
    }
  };

  throttled.cancel = cancel;
  throttled.flush = flush;
  throttled.pending = (): boolean => timeoutId !== null;
  return throttled;
}
