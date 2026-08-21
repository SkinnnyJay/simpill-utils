import { HTTP_METHOD } from "@simpill/protocols.utils";
import { ApiHttpError, ApiMissingParamError, ApiResponseParseError } from "../shared/errors";
import { VALUE_0 } from "../shared/internal-constants";
import type { ClientBuildOptions, ClientCallOptions, RouteEntry } from "./api-factory-types";
import { fetchWithRetry, fetchWithTimeout } from "./fetch-helpers";
import { parseWithSchema } from "./schema-parse";

export interface ClientBuilderLogging {
  onRequest?: (info: { method: string; url: string; routeKey?: string }) => void;
  onResponse?: (info: {
    method: string;
    url: string;
    routeKey?: string;
    status?: number;
    durationMs: number;
  }) => void;
  onError?: (info: { method: string; url: string; routeKey?: string; error: unknown }) => void;
}

export function getClientCallOptions(options: Record<string, unknown>): ClientCallOptions {
  return {
    params: (options.params as Record<string, string> | undefined) ?? {},
    query:
      (options.query as
        | Record<string, string | number | boolean | Array<string | number | boolean>>
        | undefined) ?? {},
    headers: (options.headers as Record<string, string> | undefined) ?? {},
    body: options.body,
  };
}

/**
 * Substitute :params into a path template. v1 fixes:
 * - values are percent-encoded (a param of "a/b" or "x?y=1" no longer mangles
 *   the URL / injects path segments)
 * - a missing param throws ApiMissingParamError instead of silently sending
 *   the literal ":id" segment to the server
 */
export function substitutePath(pathPattern: string, params: Record<string, string>): string {
  // The key pattern is anchored to word characters. `[^/]+` was greedy to the end of
  // the segment, so "/files/:name.json" parsed the key as "name.json", missed, and
  // emitted a URL containing a literal ":name.json" instead of raising.
  return pathPattern.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new ApiMissingParamError(key, pathPattern);
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * Serialize query params. v1 fix: array values are supported and serialize as
 * repeated keys ("tags=[a,b]" -> "tags=a&tags=b"); undefined/null entries are
 * skipped at both the top level and inside arrays.
 */
export function buildQuery(
  query: Record<string, string | number | boolean | Array<string | number | boolean>>
): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    const ek = encodeURIComponent(k);
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item === undefined || item === null) continue;
        parts.push(`${ek}=${encodeURIComponent(String(item))}`);
      }
    } else {
      parts.push(`${ek}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length === VALUE_0 ? "" : `?${parts.join("&")}`;
}

/**
 * Merge header maps case-insensitively for the Content-Type decision. v1 bug:
 * "Content-Type": "application/json" was spread LAST, so a user-supplied
 * Content-Type could NEVER override it (the README claimed the opposite) —
 * and a lowercase "content-type" produced two distinct keys, i.e. duplicate
 * headers on the wire.
 */
export function mergeHeaders(
  ...maps: Array<Record<string, string> | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  const canonical = new Map<string, string>();
  for (const map of maps) {
    if (!map) continue;
    for (const [k, v] of Object.entries(map)) {
      const lower = k.toLowerCase();
      const existingKey = canonical.get(lower);
      if (existingKey !== undefined && existingKey !== k) {
        delete out[existingKey];
      }
      canonical.set(lower, k);
      out[k] = v;
    }
  }
  return out;
}

const CONTENT_TYPE = "Content-Type";

function hasContentType(headers: Record<string, string>): boolean {
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === "content-type") return true;
  }
  return false;
}

export function buildClient(
  routes: RouteEntry[],
  defaultBaseUrl: string,
  defaultHeaders: Record<string, string>,
  logging: ClientBuilderLogging,
  opts: ClientBuildOptions = {}
): Record<string, (options?: Record<string, unknown>) => Promise<unknown>> {
  const baseUrl = (opts.baseUrl ?? defaultBaseUrl).replace(/\/$/, "");
  const baseFetcher = opts.fetcher ?? fetch;
  const doFetch = opts.timeoutMs
    ? (input: URL | string, init?: RequestInit) =>
        fetchWithTimeout(input, init, { timeoutMs: opts.timeoutMs, fetcher: baseFetcher })
    : baseFetcher;
  const fetcher =
    opts.retry && (opts.retry.maxRetries ?? VALUE_0) > VALUE_0
      ? (input: URL | string, init?: RequestInit) =>
          fetchWithRetry(input, init, {
            ...opts.retry,
            fetcher: doFetch as typeof fetch,
          })
      : doFetch;
  const validateRequest = opts.validateRequest === true;
  const clientMap: Record<string, (options?: Record<string, unknown>) => Promise<unknown>> = {};

  for (const r of routes) {
    clientMap[r.key] = async (options = {}) => {
      const call = getClientCallOptions(options);
      let { params, query, body } = call;
      if (validateRequest) {
        params = parseWithSchema<Record<string, string>>(r.schema.params, params);
        query = parseWithSchema<ClientCallOptions["query"]>(r.schema.query, query);
        if (r.schema.body) body = parseWithSchema<unknown>(r.schema.body, body);
      }
      const url = `${baseUrl}${substitutePath(r.path, params)}${buildQuery(query)}`;
      const headers = mergeHeaders(defaultHeaders, opts.headers, call.headers);
      const sendBody = body !== undefined && r.method !== HTTP_METHOD.GET;
      // Only default a Content-Type when the request actually carries one. v1 sent it
      // on bodyless GETs too, which provokes CORS preflights for nothing.
      // v1 spread Content-Type LAST, so callers could never override it. It is now
      // a default: applied only when no caller-supplied content-type exists (any
      // casing) and only when the request carries a body.
      if (sendBody && !hasContentType(headers)) {
        headers[CONTENT_TYPE] = "application/json";
      }
      const init: RequestInit = { method: r.method, headers };
      if (sendBody) {
        init.body = JSON.stringify(body);
      }
      logging.onRequest?.({ method: r.method, url, routeKey: r.key });
      const start = Date.now();
      try {
        const res = await fetcher(url, init);
        const durationMs = Date.now() - start;
        logging.onResponse?.({
          method: r.method,
          url,
          routeKey: r.key,
          status: res.status,
          durationMs,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new ApiHttpError({
            status: res.status,
            statusText: res.statusText,
            body: text,
            url,
            method: r.method,
            routeKey: r.key,
          });
        }
        const text = await res.text();
        let raw: unknown;
        if (text === "") {
          // Back-compat: empty bodies (204s etc.) parse to {} like v1.
          raw = {};
        } else {
          try {
            raw = JSON.parse(text);
          } catch (cause) {
            // v1 silently coerced ANY invalid JSON to {} — data corruption.
            throw new ApiResponseParseError({
              url,
              method: r.method,
              routeKey: r.key,
              body: text,
              cause,
            });
          }
        }
        const parsed = parseWithSchema<unknown>(r.schema.response, raw);
        return r.transform ? r.transform(parsed) : parsed;
      } catch (err) {
        logging.onError?.({ method: r.method, url, routeKey: r.key, error: err });
        throw err;
      }
    };
  }
  return clientMap;
}
