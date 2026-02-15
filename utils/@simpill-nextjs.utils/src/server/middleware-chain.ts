import type { IMiddlewareChain, MiddlewareFn, RequestLike } from "../shared/interfaces";

/**
 * Creates a middleware chain: each fn runs in order; if it returns a Response, that is used;
 * otherwise next() is called. Default implementation runs all fns until one returns or next() is used.
 */
export function createMiddlewareChain(): IMiddlewareChain {
  const fns: MiddlewareFn[] = [];

  return {
    use(fn: MiddlewareFn): void {
      fns.push(fn);
    },
    async run(request: RequestLike, defaultNext: () => Promise<Response>): Promise<Response> {
      let index = 0;
      const next = async (): Promise<Response> => {
        if (index >= fns.length) {
          return defaultNext();
        }
        const fn = fns[index++];
        return fn(request, next);
      };
      return next();
    },
  };
}
