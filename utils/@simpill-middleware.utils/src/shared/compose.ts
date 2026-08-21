import { VALUE_1 } from "./constants";
import type { Middleware, Next } from "./types";

/**
 * Compose multiple middlewares into a single middleware. They run in array
 * order; each middleware receives a `next` that invokes the next in the chain.
 *
 * Guarantees (aligned with Express / koa-compose semantics):
 * - `next(err)` with a truthy argument short-circuits the remaining composed
 *   middlewares and forwards the argument to the terminal `next` — so errors
 *   (and Express router sentinels like `"route"`) reach the framework's error
 *   handling instead of being silently swallowed. Falsy arguments
 *   (`next()`, `next(null)`, `next(undefined)`) continue the chain, matching
 *   Express's truthiness check.
 * - Calling `next()` more than once from the same middleware rejects with
 *   `"next() called multiple times"` instead of re-running downstream
 *   middlewares and invoking the terminal `next` again (the double-response
 *   bug class; same guard as koa-compose).
 * - Synchronous throws propagate synchronously (Express 4 catches these and
 *   routes them to error handlers; converting them to rejections would break
 *   that). Async rejections propagate through the returned promise when
 *   middlewares return/await `next()`.
 * - The middleware array is snapshotted: mutating it after `compose` does not
 *   change the composed chain.
 *
 * @throws TypeError at compose time if `middlewares` is not an array of functions.
 */
export function compose<Req, Res>(middlewares: Middleware<Req, Res>[]): Middleware<Req, Res> {
  if (!Array.isArray(middlewares)) {
    throw new TypeError("compose requires an array of middlewares");
  }
  for (const m of middlewares) {
    if (typeof m !== "function") {
      throw new TypeError("compose: every middleware must be a function");
    }
  }
  const stack = middlewares.slice();
  const length = stack.length;

  return function composed(req: Req, res: Res, next: Next): void | Promise<void> {
    let lastCalled = -VALUE_1;
    function dispatch(i: number, err?: unknown): void | Promise<void> {
      if (i <= lastCalled) {
        return Promise.reject(new Error("next() called multiple times"));
      }
      lastCalled = i;
      if (err) {
        // Express semantics: truthy arg short-circuits to the terminal next.
        return next(err);
      }
      if (i >= length) return next();
      return stack[i](req, res, dispatch.bind(null, i + VALUE_1) as Next);
    }
    return dispatch(0);
  };
}
