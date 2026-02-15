export type TimedResult<T> = {
  result: T;
  durationMs: number;
};

/**
 * Measure how long an async function takes.
 */
export async function timeAsync<T>(fn: () => Promise<T>): Promise<TimedResult<T>> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}

/**
 * Measure how long a promise takes to settle.
 */
export async function timePromise<T>(promise: Promise<T>): Promise<TimedResult<T>> {
  const start = Date.now();
  const result = await promise;
  return { result, durationMs: Date.now() - start };
}
