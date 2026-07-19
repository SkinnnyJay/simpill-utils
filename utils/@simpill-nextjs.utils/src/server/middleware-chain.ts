import type { IMiddlewareChain, MiddlewareFn, RequestLike } from "../shared/interfaces";

/**
 * Creates a middleware chain: each fn runs in order; if it returns a Response, that is used;
 * otherwise next() is called. Guarded koa-compose style: calling next() more than once from
 * the same middleware rejects with TypeError instead of re-running the rest of the chain
 * (the unguarded version executed the terminal handler TWICE — the double-response class).
 * The middleware list is snapshotted per run, so use() during a dispatch cannot corrupt it.
 */
export function createMiddlewareChain(): IMiddlewareChain {
  const fns: MiddlewareFn[] = [];

  return {
    use(fn: MiddlewareFn): void {
      if (typeof fn !== "function") {
        throw new TypeError("middleware must be a function");
      }
      fns.push(fn);
    },
    run(request: RequestLike, defaultNext: () => Promise<Response>): Promise<Response> {
      const stack = fns.slice();
      let lastIndex = -1;
      const dispatch = (index: number): Promise<Response> => {
        if (index <= lastIndex) {
          return Promise.reject(new TypeError("next() called multiple times"));
        }
        lastIndex = index;
        if (index >= stack.length) {
          return Promise.resolve(defaultNext());
        }
        const fn = stack[index];
        try {
          return Promise.resolve(fn(request, () => dispatch(index + 1)));
        } catch (err) {
          return Promise.reject(err);
        }
      };
      return dispatch(0);
    },
  };
}
