/**
 * Wraps a concrete implementation so it conforms to interface T.
 * Use when the implementation has a superset of T's shape and you want a typed view.
 */
export function createAdapter<T>(impl: T): T {
  return impl;
}
