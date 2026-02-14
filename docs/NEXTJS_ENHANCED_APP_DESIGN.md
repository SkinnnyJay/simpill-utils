# Next.js Enhanced App Design

Design for a **factory-wrapped, interface-driven** Next.js app surface: route define, middleware, annotations, request/response, API, logging, init, and shutdown. Everything is behind interfaces so the app is testable and composable with existing @simpill packages.

## Goals

- **Factory**: One entry point that returns an enhanced "app" object (class or facade). Next.js is used inside; the facade exposes typed helpers and lifecycle.
- **Interfaces**: Route registry, middleware, request, response, API, logging, annotations, init/shutdown are all interface-backed so implementations can be swapped (e.g. in tests).
- **Leverage monorepo**: Compose `@simpill/nextjs.utils`, `@simpill/zod.utils`, `@simpill/errors.utils`, `@simpill/request-context.utils`, `@simpill/middleware.utils`, `@simpill/logger.utils`, `@simpill/annotations.utils`, `@simpill/api.utils` where it fits.

## Concepts

| Concept | Purpose | Interface / Surface |
|--------|---------|----------------------|
| **Route define** | Typed route definitions (path, method, schema, handler key). Registry or builder; can drive codegen or wiring for App Router `app/**/route.ts`. | `IRouteRegistry` |
| **Factory** | `createNextApp(options)` returns an object that implements the interfaces below. Next.js is not literally "wrapped" (App Router is file-based); the factory returns a **facade** used in route files and middleware. | `INextApp` |
| **Middleware** | Composable middleware chain (e.g. correlation, auth, logging). Edge-safe where needed. | `IMiddlewareChain` |
| **Annotations** | Metadata on routes/handlers (e.g. auth required, rate limit key). Uses `@simpill/annotations.utils`. | `IAnnotations` |
| **Request** | Parse params, validate body/searchParams, run in request context. | `IRequestHelpers` |
| **Response** | Consistent JSON/error responses. | `IResponseHelpers` |
| **API** | Safe server actions + optional Route Handler registry (typed handlers). | `IApiHelpers` |
| **Logging** | Request-scoped logger; integrate with `@simpill/logger.utils` and request context. | `ILoggingIntegration` |
| **Init** | Async startup hooks (e.g. connect DB, load config). Call from `instrumentation.ts` or custom server. | `IInitShutdown` |
| **Shutdown** | Graceful shutdown handlers (SIGTERM/SIGINT). Register callbacks; run on signal. | `IInitShutdown` |

## Interfaces (summary)

```ts
// Shared types live in nextjs.utils/shared

interface IRouteDefinition {
  path: string;
  method: string;
  schema?: z.ZodType;
  handlerKey?: string;
  metadata?: Record<string, unknown>;
}

interface IRouteRegistry {
  define(route: IRouteDefinition): void;
  get(path: string, method: string): IRouteDefinition | undefined;
  list(): IRouteDefinition[];
}

interface IMiddlewareChain {
  use(middleware: NextJsMiddleware): void;
  run(request: NextRequest): Promise<NextResponse>;
}

interface IRequestHelpers {
  withRequestContext<T>(handler: () => Promise<T>, options?: WithRequestContextOptions): Promise<T>;
  parseSearchParams<Schema>(request: RequestLike, schema: Schema): ParseResult<Schema>;
  getRequestContext(): RequestContext | undefined;
}

interface IResponseHelpers {
  json(data: unknown, status?: number, init?: ResponseInit): Response;
  error(err: unknown, status?: number, init?: ResponseInit): Response;
}

interface IApiHelpers {
  createSafeAction<TIn, TOut>(inputSchema: z.ZodType<TIn>, handler: Handler<TIn, TOut>): SafeAction<TIn, TOut>;
}

interface ILoggingIntegration {
  setLogContextProvider(provider: () => RequestContext | undefined): void;
  getLogger(name?: string): Logger;
}

interface IAnnotations {
  getMetadata<T>(key: symbol | string, target?: object): T | undefined;
  setMetadata(key: symbol | string, value: unknown, target?: object): void;
}

interface IInitShutdown {
  onInit(fn: () => void | Promise<void>): void;
  onShutdown(fn: () => void | Promise<void>): void;
  init(): Promise<void>;
  shutdown(): Promise<void>;
}

interface INextApp {
  routes: IRouteRegistry;
  middleware: IMiddlewareChain;
  request: IRequestHelpers;
  response: IResponseHelpers;
  api: IApiHelpers;
  logging: ILoggingIntegration;
  annotations: IAnnotations;
  lifecycle: IInitShutdown;
}
```

## Factory

- **createNextApp(options?: CreateNextAppOptions): INextApp**
  - Options: `requestIdHeader`, `traceIdHeader`, `getHeaders` (for context), optional `metadataStore` (annotations), optional `logger` (or use default from logger.utils).
  - Returns an object that implements `INextApp`. Each member is the concrete implementation (e.g. `request` uses existing `withRequestContext`, `parseSearchParams`, `getRequestContext`).
  - **Init/shutdown**: The facade holds arrays of init/shutdown callbacks; `lifecycle.init()` runs them in order; `lifecycle.shutdown()` runs shutdown callbacks (e.g. from a custom server or instrumentation hook).

## Route define

- Routes are **registered** with path, method, optional Zod schema, optional handler key, optional metadata.
- In App Router, actual handlers still live in `app/**/route.ts`. The registry is used for:
  - Typed route list (e.g. for links or API docs).
  - Annotations/metadata (e.g. auth, rate limit) looked up by path+method.
  - Optional: codegen or a single dynamic route that dispatches via the registry.

## Middleware

- `middleware.use(fn)` adds to the chain. Default chain includes correlation (withCorrelation).
- `middleware.run(request)` runs the chain and returns `NextResponse`. In practice, you might export a single middleware from the app that calls `app.middleware.run(request)`.

## Annotations

- Uses `@simpill/annotations.utils` (createMetadataStore, getMetadata, setMetadata). Store can be passed into createNextApp so route/handler metadata is scoped to the app.

## Logging

- `logging.setLogContextProvider(() => getRequestContext())` wires logger.utils to request context so every log gets requestId/traceId when running inside `request.withRequestContext`.
- `logging.getLogger(name)` returns a logger (from logger.utils or a stub).

## Init / Shutdown

- **Init**: Call `lifecycle.onInit(async () => { await db.connect(); })` then in `instrumentation.ts` (or custom server startup) call `await app.lifecycle.init()`.
- **Shutdown**: Call `lifecycle.onShutdown(async () => { await db.disconnect(); })`. From a custom Node server, listen for SIGTERM/SIGINT and call `await app.lifecycle.shutdown()`.

## File layout (nextjs.utils)

- `src/shared/interfaces.ts` – all interfaces (no runtime deps on next or other packages if possible; or keep in server).
- `src/server/create-next-app.ts` – factory that builds and returns the INextApp implementation.
- `src/server/route-registry.ts` – simple in-memory IRouteRegistry.
- `src/server/middleware-chain.ts` – IMiddlewareChain that composes withCorrelation + user middleware.
- `src/server/init-shutdown.ts` – IInitShutdown (arrays of fns, init/shutdown runners).

Existing modules (create-safe-action, route-helpers, with-request-context, client middleware-helpers) stay; the factory composes them behind the interfaces.

## Dependencies

- nextjs.utils already depends on zod.utils, errors.utils, request-context.utils.
- Optional peer/dev: logger.utils (for ILoggingIntegration), annotations.utils (for IAnnotations). If we want zero extra deps, logging and annotations can be optional (no-op or pass-through) when those packages are not installed.

## References

- [AGENTS.md](../AGENTS.md) – repo guidelines
- [utils/nextjs.utils](../utils/nextjs.utils) – current implementation
- [utils/api.utils](../utils/api.utils) – createApiFactory pattern
- [utils/annotations.utils](../utils/annotations.utils) – metadata store
- [utils/logger.utils](../utils/logger.utils) – correlation context
