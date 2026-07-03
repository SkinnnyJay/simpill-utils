export type AsyncVoidFn = () => void | Promise<void>;

/**
 * Await a sync-or-async function. Any thenable is awaited — the previous
 * `result instanceof Promise` check missed custom thenables and promises
 * from other realms (jest vm contexts, iframes), which were returned
 * un-awaited and silently not flushed.
 */
export async function runAsync(fn: AsyncVoidFn): Promise<void> {
  await fn();
}

export function ref<T>(initial: T): { value: T } {
  return { value: initial };
}

export type DeferredState = "pending" | "fulfilled" | "rejected";

export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
  /** Live settlement state — handy for asserting "not yet settled" in tests. */
  readonly state: DeferredState;
};

/**
 * Externally-settleable promise (Promise.withResolvers shape) with a
 * readable settlement state. Settling is first-wins, like promises.
 */
export function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  let state: DeferredState = "pending";
  return {
    promise,
    resolve: (v: T): void => {
      if (state === "pending") {
        state = "fulfilled";
      }
      resolve(v);
    },
    reject: (e: unknown): void => {
      if (state === "pending") {
        state = "rejected";
      }
      reject(e);
    },
    get state(): DeferredState {
      return state;
    },
  };
}

export type WaitMsOptions = {
  /** Abort the wait early (rejects with the signal's reason). */
  signal?: AbortSignal;
  /** Don't hold the process open for this timer (Node only). */
  unref?: boolean;
};

type UnrefableTimer = ReturnType<typeof setTimeout> & { unref?: () => void };

export function waitMs(ms: number, options: WaitMsOptions = {}): Promise<void> {
  const { signal, unref } = options;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("waitMs: aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms) as UnrefableTimer;
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error("waitMs: aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    if (unref && typeof timer.unref === "function") {
      timer.unref();
    }
  });
}

export class WaitUntilTimeoutError extends Error {
  readonly lastError?: unknown;

  constructor(message: string, lastError?: unknown) {
    super(message);
    this.name = "WaitUntilTimeoutError";
    this.lastError = lastError;
  }
}

export type WaitUntilOptions = {
  /** Give up after this many ms (default 1000). */
  timeoutMs?: number;
  /** Poll interval in ms (default 10). */
  intervalMs?: number;
  /** Abort polling early. */
  signal?: AbortSignal;
  /** Extra context for the timeout error message. */
  message?: string;
};

/**
 * Poll a sync-or-async condition until it returns a truthy value; resolves
 * with that value. Throwing/rejecting conditions are retried until the
 * deadline; on timeout, rejects with WaitUntilTimeoutError carrying the
 * last error (if any). The standard eventually/waitFor test primitive.
 */
export async function waitUntil<T>(
  condition: () => T | Promise<T>,
  options: WaitUntilOptions = {},
): Promise<T> {
  const { timeoutMs = 1000, intervalMs = 10, signal, message } = options;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  for (;;) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error("waitUntil: aborted");
    }
    try {
      const value = await condition();
      if (value) {
        return value;
      }
      lastError = undefined;
    } catch (err) {
      lastError = err;
    }
    if (Date.now() >= deadline) {
      const suffix = message ? ` (${message})` : "";
      throw new WaitUntilTimeoutError(
        `waitUntil: condition not met within ${timeoutMs}ms${suffix}`,
        lastError,
      );
    }
    await waitMs(intervalMs, { signal });
  }
}
