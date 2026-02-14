/** Wraps a function with the same signature. */
export type Decorator<TArgs extends unknown[], TResult> = (
  fn: (...args: TArgs) => TResult
) => (...args: TArgs) => TResult;

/** Compose function decorators in order (left to right). */
export function decorate<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  ...decorators: Array<Decorator<TArgs, TResult>>
): (...args: TArgs) => TResult {
  return decorators.reduce((current, decorator) => decorator(current), fn);
}
