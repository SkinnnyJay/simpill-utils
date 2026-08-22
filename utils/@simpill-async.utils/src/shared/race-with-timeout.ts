// A late rejection of `promise` does not need swallowing: `Promise.race`
// subscribes to every input, so the rejection is already handled and can never
// surface as unhandled — even after the race has settled. Anything that moves
// off `Promise.race` has to reattach a handler itself.
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
    throw err;
  }
}
