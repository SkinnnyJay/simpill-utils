/** Simplified surface type (alias for T). */
export type Facade<T> = T;

/** Expose a value as a facade-typed surface. */
export function createFacade<T>(facade: T): Facade<T> {
  return facade;
}

/** Build a facade from dependencies and a factory. */
export function createFacadeFrom<TDeps, TFacade>(
  deps: TDeps,
  factory: (deps: TDeps) => TFacade
): Facade<TFacade> {
  return factory(deps);
}
