/**
 * Wrap `fn` so it runs at most once; subsequent calls return the cached
 * result. Preserves `this`. If the single invocation throws, the SAME error
 * is rethrown on every subsequent call (previously callers silently received
 * `undefined`, a type lie). The wrapped function reference is released after
 * the first call so its closure can be garbage-collected.
 */
export function once<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  let called = false;
  let result: TReturn;
  let threw = false;
  let error: unknown;
  let target: ((...args: TArgs) => TReturn) | null = fn;

  return function onced(this: unknown, ...args: TArgs): TReturn {
    if (!called) {
      called = true;
      try {
        result = (target as (...args: TArgs) => TReturn).apply(this, args);
      } catch (e) {
        threw = true;
        error = e;
        throw e;
      } finally {
        target = null;
      }
    }
    if (threw) throw error;
    return result;
  };
}
