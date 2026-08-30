import { ApiRouteMismatchError } from "../shared/errors";
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

/** Decode a percent-encoded path segment; fall back to the raw value on malformed input. */
function decodeSegment(value: string): string {
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Extract :params from a path. v1 fix: segments are percent-decoded, so
 * "/users/john%20doe" yields { id: "john doe" } — round-tripping what the
 * client now encodes on the way out.
 */
export function parsePathParams(pathPattern: string, path: string): Record<string, string> {
  const patternParts = pathPattern.split("/").filter(Boolean);
  const pathParts = path.replace(/^\//, "").split("/").filter(Boolean);
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part?.startsWith(":") && pathParts[i] !== undefined) {
      params[part.slice(1)] = decodeSegment(pathParts[i]);
    }
  }
  return params;
}

/**
 * Same extraction as parsePathParams, but throws ApiRouteMismatchError when
 * the segment counts differ or a static segment doesn't match literally,
 * instead of silently matching whatever positionally lines up. Opt-in: call
 * this instead of parsePathParams where a mismatched URL/pattern pair should
 * fail loudly (e.g. a dispatcher that resolved the wrong handler).
 */
export function parsePathParamsStrict(pathPattern: string, path: string): Record<string, string> {
  const patternParts = pathPattern.split("/").filter(Boolean);
  const pathParts = path.replace(/^\//, "").split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    throw new ApiRouteMismatchError(pathPattern, path);
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    const segment = pathParts[i];
    if (part?.startsWith(":")) {
      if (segment !== undefined) params[part.slice(1)] = decodeSegment(segment);
    } else if (part !== segment) {
      throw new ApiRouteMismatchError(pathPattern, path);
    }
  }
  return params;
}

/**
 * Parse the query string. v1 fix: repeated keys become arrays instead of
 * silently collapsing to the last value ("?tag=a&tag=b" was { tag: "b" }).
 * Single-valued keys stay plain strings (back-compat).
 */
export function parseQuery(searchParams: URLSearchParams): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }
  return query;
}

/** Build request context from route and request; schema parsing via parseWithSchema. */
export function buildHandlerContext(
  r: RouteEntry,
  req: { url: string; method: string; headers?: Record<string, string>; body?: unknown }
): ApiRequestContext {
  const url = new URL(req.url, "http://_");
  const pathname = url.pathname;
  const rawParams = parsePathParams(r.path, pathname);
  const rawQuery = parseQuery(url.searchParams);
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
      // Built inside the try: buildHandlerContext runs schema validation and URL parsing, so a
      // ZodError from params/query/body - the most common failure mode of a validating API -
      // was thrown before the try was entered, bypassing logging.onError and both middleware
      // onError hooks entirely.
      let currentCtx: ReturnType<typeof buildHandlerContext>;
      try {
        currentCtx = buildHandlerContext(r, req);
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
