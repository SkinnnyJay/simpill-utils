import type { INextApp } from "../shared/interfaces";
import { createAnnotationsAdapter, createNoopAnnotations } from "./annotations-adapter";
import { createSafeAction } from "./create-safe-action";
import { createInitShutdown } from "./init-shutdown";
import { createLoggingIntegration } from "./logging-adapter";
import { createMiddlewareChain } from "./middleware-chain";
import { errorResponse, jsonResponse, parseSearchParams } from "./route-helpers";
import { createRouteRegistry } from "./route-registry";
import type { WithRequestContextOptions } from "./with-request-context";
import { getRequestContext, withRequestContext } from "./with-request-context";

export interface CreateNextAppOptions {
  /** Header names for request/trace IDs (used by request.withRequestContext). */
  requestIdHeader?: string;
  traceIdHeader?: string;
  /** Optional store for annotations (get/set). If not provided, annotations are no-op. */
  annotationsStore?: {
    get<T>(key: symbol | string): T | undefined;
    set(key: symbol | string, value: unknown): void;
  };
  /** Optional: called when setLogContextProvider is invoked (e.g. wire to logger.utils). */
  setLogContextProvider?: (provider: () => unknown) => void;
}

/**
 * Returns an INextApp (routes, middleware, request/response, api, logging, annotations, lifecycle).
 * Use as the entry point for route handlers, middleware, and lifecycle hooks.
 */
export function createNextApp(options: CreateNextAppOptions = {}): INextApp {
  const { requestIdHeader, traceIdHeader, annotationsStore, setLogContextProvider } = options;

  const routes = createRouteRegistry();
  const middleware = createMiddlewareChain();
  const lifecycle = createInitShutdown();

  const requestHelpers: INextApp["request"] = {
    withRequestContext<T>(handler: () => Promise<T>, opts?: WithRequestContextOptions): Promise<T> {
      return withRequestContext(handler, {
        requestIdHeader: opts?.requestIdHeader ?? requestIdHeader,
        traceIdHeader: opts?.traceIdHeader ?? traceIdHeader,
        getHeaders: opts?.getHeaders,
      });
    },
    parseSearchParams(req, schema) {
      return parseSearchParams(req, schema);
    },
    getRequestContext() {
      return getRequestContext();
    },
  };

  const responseHelpers: INextApp["response"] = {
    json: (data, status, init) => jsonResponse(data, status, init),
    error: (err, status, init) => errorResponse(err, status, init),
  };

  const apiHelpers: INextApp["api"] = {
    createSafeAction,
  };

  const logging = createLoggingIntegration({
    setLogContextProvider,
    getRequestContext: () => getRequestContext(),
  });

  const annotations = annotationsStore
    ? createAnnotationsAdapter(annotationsStore)
    : createNoopAnnotations();

  return {
    routes,
    middleware,
    request: requestHelpers,
    response: responseHelpers,
    api: apiHelpers,
    logging,
    annotations,
    lifecycle,
  };
}
