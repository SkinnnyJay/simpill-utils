/** Function that creates an instance of T (optionally with args). */
export type Factory<T, TArgs extends unknown[] = []> = (...args: TArgs) => T;

/**
 * Factory Method pattern: wrap a function as a typed Factory<T, TArgs>.
 * Named createPatternFactory to avoid collision with @simpill/factories.utils#createFactory.
 * @param factory - Function that returns T
 * @returns The same function typed as Factory<T, TArgs>
 */
export function createPatternFactory<T, TArgs extends unknown[]>(
  factory: Factory<T, TArgs>
): Factory<T, TArgs> {
  return factory;
}
