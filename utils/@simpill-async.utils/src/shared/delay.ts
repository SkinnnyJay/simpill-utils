import { ERROR_NAME_ABORT, ERROR_OPERATION_ABORTED } from "./constants";

/** Options for delay: optional AbortSignal and timer unref. */
export interface DelayOptions {
  /** Abort the delay early; rejects with signal.reason (or an AbortError). */
  signal?: AbortSignal;
  /** Unref the timer so a pending delay never keeps the Node process alive. No-op in browsers. */
  unref?: boolean;
}

const createAbortError = (signal?: AbortSignal): Error => {
  const reason = signal?.reason;
  if (reason instanceof Error) return reason;
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

/** Resolve after ms milliseconds. Optionally abortable and unref-able. */
export function delay(ms: number, options?: DelayOptions): Promise<void> {
  const signal = options?.signal;
  if (signal?.aborted) return Promise.reject(createAbortError(signal));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    if (options?.unref) {
      (timer as { unref?: () => void }).unref?.();
    }
    const onAbort = signal
      ? (): void => {
          clearTimeout(timer);
          reject(createAbortError(signal));
        }
      : undefined;
    if (signal && onAbort) signal.addEventListener("abort", onAbort, { once: true });
  });
}
