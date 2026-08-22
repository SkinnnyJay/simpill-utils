// A late rejection of `promise` does not need swallowing: `Promise.race`
// subscribes to every input, so the rejection is already handled and can never
// surface as unhandled — even after the race has settled. Anything that moves
// off `Promise.race` has to reattach a handler itself.

/** Result of running a promise with a timeout: fulfilled, rejected, or timed_out. */
export type TimeoutResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown }
  | { status: "timed_out"; error: Error };

/**
 * Resolve with a status object rather than throwing on timeout or rejection.
 * @param promise - Promise to run
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutError - Optional error for timed_out (default: message with timeoutMs)
 * @returns Promise of TimeoutResult (never throws)
 */
export async function timeoutResult<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error,
): Promise<TimeoutResult<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<TimeoutResult<T>>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        status: "timed_out",
        error: timeoutError ?? new Error(`Operation timed out after ${timeoutMs}ms`),
      });
    }, timeoutMs);
  });

  const settledPromise = promise
    .then((value) => ({ status: "fulfilled", value }) as TimeoutResult<T>)
    .catch((reason) => ({ status: "rejected", reason }) as TimeoutResult<T>);

  const result = await Promise.race([settledPromise, timeoutPromise]);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
  }

  return result;
}
