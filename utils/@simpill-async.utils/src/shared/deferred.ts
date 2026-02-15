/** Promise with external resolve/reject (e.g. p-defer). */
export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

/**
 * Deferred promise helper (p-defer).
 * @returns Object with promise, resolve, reject
 */
export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Alias for createDeferred.
 * @returns Object with promise, resolve, reject
 */
export function defer<T>(): Deferred<T> {
  return createDeferred<T>();
}
