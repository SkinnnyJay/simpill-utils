export type TimeoutFallback<T> = {
  fallback: T;
};

/**
 * Resolve with fallback if timeout wins, otherwise resolve original promise.
 */
export async function timeoutWithFallback<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timeoutWon = false;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      timeoutWon = true;
      resolve(fallback);
    }, timeoutMs);
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
    if (timeoutWon) {
      // Prevent unhandled rejection from late settlement.
      promise.catch(() => {});
    }
  }
}
