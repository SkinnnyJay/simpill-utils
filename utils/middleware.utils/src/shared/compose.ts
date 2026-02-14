import type { Middleware, Next } from "./types";

/**
 * Compose multiple middlewares into a single middleware. They run in array order;
 * each middleware receives a `next` that invokes the next in the chain.
 */
export function compose<Req, Res>(
  middlewares: Middleware<Req, Res>[],
): Middleware<Req, Res> {
  return (req: Req, res: Res, next: Next): void | Promise<void> => {
    let i = 0;
    const run = (): void | Promise<void> => {
      if (i >= middlewares.length) return next();
      const m = middlewares[i++];
      return m(req, res, run);
    };
    return run();
  };
}
