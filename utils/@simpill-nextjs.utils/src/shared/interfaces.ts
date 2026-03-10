/**
 * Interfaces for the Next.js app facade.
 * Generic (Request/Response) so shared code does not depend on next.
 */

import type { z } from "zod";

/** Single route definition for the registry. */
export interface IRouteDefinition {
  path: string;
  method: string;
  schema?: z.ZodType;
  handlerKey?: string;
  metadata?: Record<string, unknown>;
}

/** Registry of route definitions (define, get, list). */
export interface IRouteRegistry {
  define(route: IRouteDefinition): void;
  get(path: string, method: string): IRouteDefinition | undefined;
  list(): IRouteDefinition[];
}

/** Request-like shape for parsing (url, nextUrl.searchParams, headers). */
export interface RequestLike {
  url?: string;
  headers?: Headers;
  nextUrl?: { searchParams?: URLSearchParams };
}

/** Result of parsing search params with a schema. */
export type ParseSearchParamsResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/** Options for running a handler inside request context. */
export interface RequestContextOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
  getHeaders?: () => Headers | Promise<Headers>;
}

/** Helpers for request parsing and context. */
export interface IRequestHelpers {
  withRequestContext<T>(handler: () => Promise<T>, options?: RequestContextOptions): Promise<T>;
  parseSearchParams<Schema extends z.ZodType>(
    request: RequestLike,
    schema: Schema
  ): ParseSearchParamsResult<z.infer<Schema>>;
  getRequestContext(): unknown;
}

/** Helpers for JSON and error responses. */
export interface IResponseHelpers {
  json(data: unknown, status?: number, init?: ResponseInit): Response;
  error(err: unknown, status?: number, init?: ResponseInit): Response;
}

/** Safe action creator signature. */
export interface IApiHelpers {
  createSafeAction<TIn, TOut>(
    inputSchema: z.ZodType<TIn>,
    handler: (input: TIn) => Promise<TOut> | TOut
  ): (input: unknown) => Promise<{
    data?: TOut;
    error?: { message: string; code?: string; validation?: Record<string, string> };
  }>;
}

/** Logger interface (minimal for integration). */
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/** Logging integration (set context provider, get logger). */
export interface ILoggingIntegration {
  setLogContextProvider(provider: () => unknown): void;
  getLogger(name?: string): ILogger;
}

/** Annotations / metadata for routes or handlers. */
export interface IAnnotations {
  getMetadata<T>(key: symbol | string, target?: object): T | undefined;
  setMetadata(key: symbol | string, value: unknown, target?: object): void;
}

/** Init and shutdown lifecycle hooks. */
export interface IInitShutdown {
  onInit(fn: () => void | Promise<void>): void;
  onShutdown(fn: () => void | Promise<void>): void;
  init(): Promise<void>;
  shutdown(): Promise<void>;
}

/** Middleware function: (request, next) => response. */
export type MiddlewareFn = (
  request: RequestLike,
  next: () => Promise<Response>
) => Response | Promise<Response>;

/** Composable middleware chain. */
export interface IMiddlewareChain {
  use(fn: MiddlewareFn): void;
  run(request: RequestLike, defaultNext: () => Promise<Response>): Promise<Response>;
}

/** INextApp: routes, middleware, request, response, api, logging, annotations, lifecycle. */
export interface INextApp {
  routes: IRouteRegistry;
  middleware: IMiddlewareChain;
  request: IRequestHelpers;
  response: IResponseHelpers;
  api: IApiHelpers;
  logging: ILoggingIntegration;
  annotations: IAnnotations;
  lifecycle: IInitShutdown;
}
