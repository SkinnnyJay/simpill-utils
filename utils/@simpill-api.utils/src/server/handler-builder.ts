import type { ApiRequestContext } from "../shared/types";
import type { RouteEntry, RouteMiddleware } from "./api-factory-types";
import { parseWithSchema } from "./schema-parse";

export interface HandlerBuilderLogging {
  onRequest?: (info: { method: string; url: string; routeKey?: string }) => void;
  onResponse?: (info: {
    method: string;
    url: string;
    routeKey?: string;
    durationMs: number;
  }) => void;
  onError?: (info: { method: string; url: string; routeKey?: string; error: unknown }) => void;
}

export function parsePathParams(pathPattern: string, path: string): Record<string, string> {
  const patternParts = pathPattern.split("/").filter(Boolean);
  const pathParts = path.replace(/^\//, "").split("/").filter(Boolean);
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part?.startsWith(":") && pathParts[i] !== undefined) {
      params[part.slice(1)] = pathParts[i];
    }
  }
  return params;
}

/** Build request context from route and request; schema parsing via parseWithSchema. */
export function buildHandlerContext(
  r: RouteEntry,
  req: { url: string; method: string; headers?: Record<string, string>; body?: unknown }
): ApiRequestContext {
  const url = new URL(req.url, "http://_");
  const pathname = url.pathname;
  const rawParams = parsePathParams(r.path, pathname);
  const rawQuery = Object.fromEntries(url.searchParams.entries()) as Record<string, unknown>;
  const params = parseWithSchema<Record<string, string>>(r.schema.params, rawParams);
  const query = parseWithSchema<Record<string, unknown>>(r.schema.query, rawQuery);
  const body = parseWithSchema<unknown>(r.schema.body, req.body ?? {});
  return {
    params,
    query,
    body,
    headers: req.headers ?? {},
    method: r.method,
    url: req.url,
  };
}

export function buildHandlers(
  routes: RouteEntry[],
  globalMiddleware: RouteMiddleware,
  logging: HandlerBuilderLogging
): Record<
  string,
  (req: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
  }) => Promise<unknown>
> {
  const handlerMap: Record<
    string,
    (req: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: unknown;
    }) => Promise<unknown>
  > = {};

  for (const r of routes) {
    const handlerFn = r.handler;
    if (!handlerFn) continue;
    handlerMap[r.key] = async (req) => {
      logging.onRequest?.({ method: r.method, url: req.url, routeKey: r.key });
      const start = Date.now();
      let currentCtx = buildHandlerContext(r, req);
      try {
        if (globalMiddleware.before) {
          currentCtx = await globalMiddleware.before(currentCtx);
        }
        if (r.middleware?.before) {
          currentCtx = await r.middleware.before(currentCtx);
        }
        let result = await handlerFn(currentCtx);
        if (r.middleware?.after) {
          result = await r.middleware.after(currentCtx, result);
        }
        if (globalMiddleware.after) {
          result = await globalMiddleware.after(currentCtx, result);
        }
        const durationMs = Date.now() - start;
        logging.onResponse?.({ method: r.method, url: req.url, routeKey: r.key, durationMs });
        return result;
      } catch (err) {
        logging.onError?.({ method: r.method, url: req.url, routeKey: r.key, error: err });
        if (r.middleware?.onError) {
          await r.middleware.onError(err);
        }
        if (globalMiddleware.onError) {
          await globalMiddleware.onError(err);
        }
        throw err;
      }
    };
  }
  return handlerMap;
}
