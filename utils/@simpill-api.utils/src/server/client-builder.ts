import { HTTP_METHOD } from "@simpill/protocols.utils";
import {
  ERROR_HTTP_RESPONSE_PREFIX,
  ERROR_HTTP_RESPONSE_SEP,
  VALUE_0,
} from "../shared/internal-constants";
import type { ClientCallOptions, RouteEntry } from "./api-factory-types";
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
    query: (options.query as Record<string, string | number | boolean> | undefined) ?? {},
    headers: (options.headers as Record<string, string> | undefined) ?? {},
    body: options.body,
  };
}

export function substitutePath(pathPattern: string, params: Record<string, string>): string {
  return pathPattern.replace(/:([^/]+)/g, (_, key) => params[key] ?? `:${key}`);
}

export function buildQuery(query: Record<string, string | number | boolean>): string {
  const entries = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length === VALUE_0 ? "" : `?${entries.join("&")}`;
}

export function buildClient(
  routes: RouteEntry[],
  defaultBaseUrl: string,
  defaultHeaders: Record<string, string>,
  logging: ClientBuilderLogging,
  opts: {
    baseUrl?: string;
    headers?: Record<string, string>;
    fetcher?: typeof fetch;
    retry?: { maxRetries?: number; delayMs?: number };
    timeoutMs?: number;
  } = {}
): Record<string, (options?: Record<string, unknown>) => Promise<unknown>> {
  const baseUrl = (opts.baseUrl ?? defaultBaseUrl).replace(/\/$/, "");
  const headers = { ...defaultHeaders, ...opts.headers };
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
  const clientMap: Record<string, (options?: Record<string, unknown>) => Promise<unknown>> = {};

  for (const r of routes) {
    clientMap[r.key] = async (options = {}) => {
      const { params, query, body, headers: extraHeaders } = getClientCallOptions(options);
      const url = `${baseUrl}${substitutePath(r.path, params)}${buildQuery(query)}`;
      const init: RequestInit = {
        method: r.method,
        headers: { ...headers, ...extraHeaders, "Content-Type": "application/json" },
      };
      if (body !== undefined && r.method !== HTTP_METHOD.GET) {
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
          const text = await res.text();
          throw new Error(ERROR_HTTP_RESPONSE_PREFIX + res.status + ERROR_HTTP_RESPONSE_SEP + text);
        }
        const raw = await res.json().catch(() => ({}));
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
