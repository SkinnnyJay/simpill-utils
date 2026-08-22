export type TimeoutFallback<T> = {
  fallback: T;
};

// A late rejection of `promise` does not need swallowing: `Promise.race`
// subscribes to every input, so the rejection is already handled and can never
// surface as unhandled — even after the race has settled. Anything that moves
// off `Promise.race` has to reattach a handler itself.
/**
 * Resolve with fallback if timeout wins, otherwise resolve original promise.
 */
export async function timeoutWithFallback<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    // `finally`, not a trailing statement: `promise` may reject before the
    // deadline, and an armed timer holds the Node event loop open for the rest
    // of `timeoutMs` after the caller has already seen the error.
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
