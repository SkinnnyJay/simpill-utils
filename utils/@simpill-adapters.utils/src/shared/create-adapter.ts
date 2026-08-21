/**
 * Wraps a concrete implementation so it conforms to interface T.
 * Use when the implementation has a superset of T's shape and you want a typed view.
 *
 * NOTE: the type parameter must be given explicitly
 * (`createAdapter<CacheAdapter>(redisImpl)`); when inferred, T becomes the
 * full concrete type and no narrowing happens. This is a compile-time view
 * only — at runtime the returned value is the implementation itself, so
 * every superset member is still reachable. For a runtime-enforced view
 * with bound methods, use {@link scopedAdapter}.
 */
export function createAdapter<T>(impl: T): T {
  return impl;
}

/**
 * Builds a runtime-narrowed view of `impl` exposing only `members`:
 * methods are bound to `impl` (so destructuring never loses `this` — e.g.
 * `const { get } = scopedAdapter(new Map(), ["get", "set"])` works, while
 * destructuring a raw Map method throws), and non-function members are
 * exposed as live getters. Members not listed do not exist on the result,
 * so superset capabilities (e.g. `disconnect`) are unreachable, unlike
 * {@link createAdapter}'s compile-time-only view.
 */
export function scopedAdapter<T extends object, K extends keyof T>(
  impl: T,
  members: readonly K[]
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const member of members) {
    const value = impl[member];
    if (typeof value === "function") {
      out[member] = (value as (...args: unknown[]) => unknown).bind(impl) as T[K];
    } else {
      Object.defineProperty(out, member, {
        enumerable: true,
        get: () => impl[member],
      });
    }
  }
  return out;
}
