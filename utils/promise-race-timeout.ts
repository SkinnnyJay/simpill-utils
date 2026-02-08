/**
 * Safe Promise.race with timeout cleanup
 * 
 * Executes a promise with a timeout, ensuring the timeout is always cleared
 * even if the main promise resolves first. This prevents memory leaks from
 * unresolved timeout promises.
 * 
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutError Optional custom error to throw on timeout
 * @returns The result of the promise, or throws timeout error
 */
export async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    // Clear timeout if promise resolved first
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return result;
  } catch (error) {
    // Clear timeout on error (whether from promise or timeout)
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    throw error;
  }
}
