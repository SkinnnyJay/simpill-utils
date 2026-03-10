/** Function that creates an instance of T (optionally with args). */
export type Factory<T, TArgs extends unknown[] = []> = (...args: TArgs) => T;

/**
 * Factory Method: create a typed factory function.
 * @param factory - Function that returns T
 * @returns The same function typed as Factory<T, TArgs>
 */
export function createFactory<T, TArgs extends unknown[]>(
  factory: Factory<T, TArgs>
): Factory<T, TArgs> {
  return factory;
}
