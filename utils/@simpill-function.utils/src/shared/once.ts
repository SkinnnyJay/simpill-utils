export function once<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  let called = false;
  let result: TReturn;
  return (...args: TArgs): TReturn => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}
