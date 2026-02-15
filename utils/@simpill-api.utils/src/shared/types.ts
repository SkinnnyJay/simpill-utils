import type { HttpMethod } from "@simpill/protocols.utils";
import type { z } from "zod";

/** HTTP method for a route (from @simpill/protocols.utils) */
export type { HttpMethod };

/** Zod-backed schema for params, query, body, response */
export interface ApiSchema<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
> {
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
  body?: z.ZodType<TBody>;
  response?: z.ZodType<TResponse>;
}

/** Single route definition with method and schema */
export interface ApiRouteDef<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
> {
  method: HttpMethod;
  path: string;
  schema: ApiSchema<TParams, TQuery, TBody, TResponse>;
  transform?: (data: TResponse) => unknown;
}

/** Request context passed to handlers and middleware */
export interface ApiRequestContext<TParams = unknown, TQuery = unknown, TBody = unknown> {
  params: TParams;
  query: TQuery;
  body: TBody;
  headers: Record<string, string>;
  method: HttpMethod;
  url: string;
}

/**
 * Handler function for a route. Type at call site: use ApiHandler<TParams, TQuery, TBody, TResponse>
 * or infer TResponse from your route's response schema (e.g. z.infer<typeof responseSchema>).
 */
export type ApiHandler<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
> = (ctx: ApiRequestContext<TParams, TQuery, TBody>) => TResponse | Promise<TResponse>;

/** Typed client method for a route */
export type ApiClientMethod<TResponse = unknown> = (options?: {
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: Record<string, string>;
}) => Promise<TResponse>;

/** Typed API client: map of route keys to client methods */
export type ApiClient = Record<string, ApiClientMethod>;

/** Middleware: before (request), after (response), onError */
export interface ApiMiddleware<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TResponse = unknown,
> {
  before?: (
    ctx: ApiRequestContext<TParams, TQuery, TBody>
  ) =>
    | ApiRequestContext<TParams, TQuery, TBody>
    | Promise<ApiRequestContext<TParams, TQuery, TBody>>;
  after?: (
    ctx: ApiRequestContext<TParams, TQuery, TBody>,
    result: TResponse
  ) => TResponse | Promise<TResponse>;
  onError?: (err: unknown) => never | void | Promise<void>;
}

/** Options for retry/timeout helpers */
export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  timeoutMs?: number;
}
