import type { HttpMethod } from "@simpill/protocols.utils";
import type {
  ApiRoutesShape,
  ApiSchemaLike,
  HandlerRequest,
  RouteKey,
  TypedClient,
  TypedHandler,
  TypedHandlers,
} from "../shared/infer";
import type { ApiHandler, ApiRequestContext, ApiSchema } from "../shared/types";
import type { HttpRetryPolicy } from "@simpill/http.utils";

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

/** Options accepted by api.client(). */
export interface ClientBuildOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  fetcher?: typeof fetch;
  retry?: {
    maxRetries?: number;
    delayMs?: number;
    /** Advanced knobs passed through to @simpill/http.utils fetchWithRetry. */
    policy?: HttpRetryPolicy;
  };
  timeoutMs?: number;
  /**
   * Validate params/query/body against the route's Zod schemas BEFORE sending
   * (throws ZodError client-side). Off by default (v1 compat: schemas only
   * validated the response on the client).
   */
  validateRequest?: boolean;
}

/**
 * Fluent route builder. Each verb accumulates the route's schema (and whether
 * a handler was attached) into the factory's type-level route map, so
 * client() and handlers() come back fully typed.
 */
export interface RouteBuilder<
  TRoutes extends ApiRoutesShape,
  P extends string,
  N extends string | undefined,
> {
  withMiddleware: (m: RouteMiddleware) => RouteBuilder<TRoutes, P, N>;
  get: RouteVerb<TRoutes, P, N, "GET">;
  post: RouteVerb<TRoutes, P, N, "POST">;
  put: RouteVerb<TRoutes, P, N, "PUT">;
  patch: RouteVerb<TRoutes, P, N, "PATCH">;
  delete: RouteVerb<TRoutes, P, N, "DELETE">;
}

/** A single verb on the route builder; overloaded to track handler presence. */
export interface RouteVerb<
  TRoutes extends ApiRoutesShape,
  P extends string,
  N extends string | undefined,
  M extends HttpMethod,
> {
  /** Define the route without a handler (client-only). */
  <S extends ApiSchemaLike>(
    schema: S
  ): ApiFactory<TRoutes & Record<RouteKey<M, P, N>, { schema: S; hasHandler: false }>>;
  /** Define the route with a typed handler (appears in handlers()). */
  <S extends ApiSchemaLike>(
    schema: S,
    handler: TypedHandler<S>
  ): ApiFactory<TRoutes & Record<RouteKey<M, P, N>, { schema: S; hasHandler: true }>>;
}

// biome-ignore lint/complexity/noBannedTypes: {} is the identity for route-map accumulation
export interface ApiFactory<TRoutes extends ApiRoutesShape = {}> {
  route<P extends string>(path: P): RouteBuilder<TRoutes, P, undefined>;
  route<P extends string, N extends string>(path: P, name: N): RouteBuilder<TRoutes, P, N>;
  /**
   * Build a typed fetch client. Method names, option shapes (params/query/
   * body), and return types are all inferred from the route definitions.
   */
  client: (opts?: ClientBuildOptions) => TypedClient<TRoutes>;
  /**
   * Typed handler registry: only routes defined WITH a handler appear, and
   * each returns the response schema's inferred type.
   */
  handlers: () => TypedHandlers<TRoutes>;
}

/** Loosely-typed aliases for consumers that annotate explicitly (v1 compat). */
export type AnyApiFactory = ApiFactory<ApiRoutesShape>;
export type AnyApiClient = Record<string, (options?: Record<string, unknown>) => Promise<unknown>>;
export type AnyApiHandlers = Record<string, (req: HandlerRequest) => Promise<unknown>>;

export interface ClientCallOptions {
  params: Record<string, string>;
  query: Record<string, string | number | boolean | Array<string | number | boolean>>;
  headers: Record<string, string>;
  body: unknown;
}
