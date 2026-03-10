import { HTTP_METHOD, type HttpMethod } from "@simpill/protocols.utils";
import type { FetchLike, HttpRequestOptions, HttpRetryPolicy } from "../shared";
import { VALUE_0 } from "../shared/constants";
import { fetchWithRetry } from "./fetch-with-retry";
import { fetchWithTimeout } from "./fetch-with-timeout";

export interface CreateHttpClientOptions {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  defaultRetry?: HttpRetryPolicy;
  fetch?: FetchLike;
}

function resolveUrl(baseUrl: string | undefined, url: string): string {
  if (!baseUrl) return url;
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

export interface HttpClient {
  get(url: string, options?: HttpRequestOptions): Promise<Response>;
  post(url: string, body?: BodyInit, options?: HttpRequestOptions): Promise<Response>;
  put(url: string, body?: BodyInit, options?: HttpRequestOptions): Promise<Response>;
  patch(url: string, body?: BodyInit, options?: HttpRequestOptions): Promise<Response>;
  delete(url: string, options?: HttpRequestOptions): Promise<Response>;
}

export function createHttpClient(options?: CreateHttpClientOptions): HttpClient {
  const baseUrl = options?.baseUrl;
  const defaultTimeoutMs = options?.defaultTimeoutMs;
  const defaultRetry = options?.defaultRetry;
  const fetchFn = options?.fetch ?? fetch;

  const request = async (
    method: HttpMethod,
    url: string,
    body?: BodyInit,
    opts?: HttpRequestOptions,
  ): Promise<Response> => {
    const resolved = resolveUrl(baseUrl, url);
    const headers = opts?.headers ?? {};
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = body;
    if (opts?.signal) init.signal = opts.signal;

    if (defaultRetry && Object.keys(defaultRetry).length > VALUE_0) {
      return fetchWithRetry(resolved, init, { retry: defaultRetry, fetch: fetchFn });
    }

    const timeoutMs = opts?.timeoutMs ?? defaultTimeoutMs;
    if (timeoutMs != null && timeoutMs > VALUE_0) {
      return fetchWithTimeout(resolved, { ...init, timeoutMs }, fetchFn);
    }

    return fetchFn(resolved, init);
  };

  return {
    get(url, opts) {
      return request(HTTP_METHOD.GET, url, undefined, opts);
    },
    post(url, body, opts) {
      return request(HTTP_METHOD.POST, url, body, opts);
    },
    put(url, body, opts) {
      return request(HTTP_METHOD.PUT, url, body, opts);
    },
    patch(url, body, opts) {
      return request(HTTP_METHOD.PATCH, url, body, opts);
    },
    delete(url, opts) {
      return request(HTTP_METHOD.DELETE, url, undefined, opts);
    },
  };
}
