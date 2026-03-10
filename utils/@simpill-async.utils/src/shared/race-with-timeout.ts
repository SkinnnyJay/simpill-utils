/**
 * Run a promise with a timeout. Clears the timeout if the promise settles first.
 */
export async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(timeoutError ?? new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    return result;
  } catch (err) {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    // Swallow late rejection from the original promise so it does not become unhandled
    promise.catch(() => {});
    throw err;
  }
}
