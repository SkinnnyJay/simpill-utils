import type { HttpMethod } from "@simpill/protocols.utils";
import type { ApiHandler, ApiRequestContext, ApiSchema } from "../shared/types";

/** Optional logging hook for request start (client or handler). */
export type OnRequestLog = (info: { method: string; url: string; routeKey?: string }) => void;

/** Optional logging hook for request end (client: status/duration; handler: duration). */
export type OnResponseLog = (info: {
  method: string;
  url: string;
  routeKey?: string;
  status?: number;
  durationMs: number;
}) => void;

/** Optional logging hook for request errors. */
export type OnErrorLog = (info: {
  method: string;
  url: string;
  routeKey?: string;
  error: unknown;
}) => void;

export interface CreateApiFactoryOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  /** Optional request/response logging for DX and debugging. */
  logging?: {
    onRequest?: OnRequestLog;
    onResponse?: OnResponseLog;
    onError?: OnErrorLog;
  };
  middleware?: {
    before?: (ctx: ApiRequestContext) => ApiRequestContext | Promise<ApiRequestContext>;
    after?: (ctx: ApiRequestContext, result: unknown) => unknown | Promise<unknown>;
    onError?: (err: unknown) => void | Promise<void>;
  };
}

export interface RouteMiddleware {
  before?: (ctx: ApiRequestContext) => ApiRequestContext | Promise<ApiRequestContext>;
  after?: (ctx: ApiRequestContext, result: unknown) => unknown | Promise<unknown>;
  onError?: (err: unknown) => void | Promise<void>;
}

export interface RouteEntry {
  key: string;
  method: HttpMethod;
  path: string;
  schema: ApiSchema;
  transform?: (data: unknown) => unknown;
  handler?: ApiHandler;
  middleware?: RouteMiddleware;
}

export interface RouteBuilder {
  withMiddleware: (m: RouteMiddleware) => RouteBuilder;
  get: (schema: ApiSchema, handler?: ApiHandler) => ApiFactory;
  post: (schema: ApiSchema, handler?: ApiHandler) => ApiFactory;
  put: (schema: ApiSchema, handler?: ApiHandler) => ApiFactory;
  patch: (schema: ApiSchema, handler?: ApiHandler) => ApiFactory;
  delete: (schema: ApiSchema, handler?: ApiHandler) => ApiFactory;
}

export interface ApiFactory {
  route: (path: string, name?: string) => RouteBuilder;
  /**
   * Build a fetch client: keys are route names, values are (options?) => Promise<unknown>.
   * Type the return at call site from your route schema (e.g. z.infer<typeof mySchema.response>).
   */
  client: (opts?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    fetcher?: typeof fetch;
    retry?: { maxRetries?: number; delayMs?: number };
    timeoutMs?: number;
  }) => Record<string, (options?: Record<string, unknown>) => Promise<unknown>>;
  /**
   * Request handlers keyed by route; req has url, method, headers?, body?.
   * Return type is Promise<unknown>; type from your route schema at use site.
   */
  handlers: () => Record<
    string,
    (req: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: unknown;
    }) => Promise<unknown>
  >;
}

export interface ClientCallOptions {
  params: Record<string, string>;
  query: Record<string, string | number | boolean>;
  headers: Record<string, string>;
  body: unknown;
}
