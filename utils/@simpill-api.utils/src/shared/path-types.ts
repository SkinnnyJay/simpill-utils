/**
 * Compile-time extraction of `:param` segments from a route path literal.
 * `PathParams<"/users/:id/posts/:postId">` -> `{ id: string; postId: string }`.
 *
 * Useful when a route has no `params` schema (so nothing else infers the
 * shape of its path params from a Zod type) but the path itself still names
 * them - this recovers a typed object instead of falling back to a loose
 * `Record<string, string>`.
 */
export type PathParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof PathParams<`/${Rest}`>]: string }
  : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : // biome-ignore lint/complexity/noBannedTypes: canonical "no params" sentinel
      {};

/** True when `Path` names at least one `:param` segment. */
export type HasPathParams<Path extends string> = keyof PathParams<Path> extends never
  ? false
  : true;
