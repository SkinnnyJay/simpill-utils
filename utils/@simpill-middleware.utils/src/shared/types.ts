/**
 * Continuation passed to a middleware. Calling it with no argument (or a
 * nullish argument) continues the chain; calling it with a truthy argument
 * short-circuits the chain and forwards that argument to the terminal `next`
 * (Express semantics — the argument is usually an `Error`, but Express router
 * sentinels like `"route"` are forwarded the same way).
 *
 * Backward compatible: every `() => void | Promise<void>` is assignable here.
 */
export type Next = (err?: unknown) => void | Promise<void>;

export interface MiddlewareRequest {
  headers?: HeadersLike;
  [key: string]: unknown;
}

/**
 * Incoming headers: either a plain record (Node http / Express / Fastify) or
 * a Fetch-API `Headers`-shaped object exposing `get(name)` (Edge runtimes,
 * Next.js, undici). Both are supported by `createCorrelationMiddleware`.
 */
export type HeadersLike =
  | Record<string, string | string[] | undefined>
  | { get(name: string): string | null };

export interface MiddlewareResponse {
  setHeader?(name: string, value: string): void;
  [key: string]: unknown;
}

export type Middleware<Req = MiddlewareRequest, Res = MiddlewareResponse> = (
  req: Req,
  res: Res,
  next: Next,
) => void | Promise<void>;

/**
 * Express-style error-handling middleware `(err, req, res, next)`.
 * Not invoked by `compose` (register it with your framework after the normal
 * chain); exported so consumers don't have to hand-roll the type.
 */
export type ErrorMiddleware<Req = MiddlewareRequest, Res = MiddlewareResponse> = (
  err: unknown,
  req: Req,
  res: Res,
  next: Next,
) => void | Promise<void>;
