# Next.js Enhanced App Factory – Design

A factory that returns an **enhanced Next.js facade**: one object (or class) exposing **route define**, **middleware**, **annotations**, **request**, **response**, **api**, **logging**, **init**, and **shutdown** behind interfaces. Next.js stays inside; the app uses the facade for all cross-cutting concerns.

## Goals

- **Single entry** – One factory (e.g. `createNextApp(options)`) returns a typed object with everything the app needs.
- **Interfaces everywhere** – Request, response, logger, middleware, lifecycle are interfaces so implementations can be swapped (e.g. testing, different runtimes).
- **Compose @simpill packages** – Uses nextjs.utils, request-context.utils, zod.utils, errors.utils, middleware.utils, annotations.utils, logger.utils where applicable.
- **App Router friendly** – Works with file-based App Router (no single “app” instance); the facade provides helpers and registries used inside `route.ts`, `middleware.ts`, and instrumentation.

## Concepts

| Concept | Purpose | Interface / surface |
|--------|---------|----------------------|
| **Route define** | Typed route registry: path, method, schema, optional metadata. Drives types and optional codegen; actual handlers still live in `app/**/route.ts`. | `IRouteRegistry` / `defineRoute()` |
| **Factory** | Builds the enhanced instance (config + request/response/api/middleware/logging/init/shutdown). | `createNextApp(options)` → `INextApp` |
| **Middleware** | Chain of (request, next) → response. Correlation, auth, logging. Edge-safe where possible. | `IMiddlewareChain` / `use(middleware)` |
| **Annotations** | Metadata on routes or handlers (e.g. auth required, rate limit key). Uses annotations.utils. | `getRouteMetadata()`, `setRouteMetadata()` |
| **Request** | Parse, validate, and context for the current request. | `IRequestHelpers` (parseSearchParams, withRequestContext, getRequestContext) |
| **Response** | Consistent JSON and error responses. | `IResponseHelpers` (jsonResponse, errorResponse) |
| **API** | Server actions and/or route handler registry. Typed actions via createSafeAction. | `IAppApi` (createSafeAction, optional handler map) |
| **Logging** | Request-scoped logger (logger.utils + request context). | `ILogging` (getLogger()) |
| **Init** | Async startup (DB, caches, config). Run from `instrumentation.ts` or custom server. | `IInitShutdown` (onInit(fn), runInit()) |
| **Shutdown** | Graceful teardown (close connections, flush logs). Register handlers; run on SIGTERM. | `IInitShutdown` (onShutdown(fn), runShutdown()) |

## Interfaces (summary)

```ts
// Request: validation + context
interface IRequestHelpers {
  parseSearchParams<S>(request: RequestLike, schema: z.ZodType<S>): ParsedSearchParams<S>;
  withRequestContext<T>(handler: () => Promise<T>, options?: WithRequestContextOptions): Promise<T>;
  getRequestContext(): RequestContext | undefined;
}

// Response: consistent JSON and errors
interface IResponseHelpers {
  jsonResponse(data: unknown, status?: number, init?: ResponseInit): Response;
  errorResponse(err: unknown, status?: number, init?: ResponseInit): Response;
}

// API: safe actions + optional route handler registry
interface IAppApi {
  createSafeAction<TIn, TOut>(inputSchema: z.ZodType<TIn>, handler: Handler<TIn, TOut>, options?): ActionFn<TOut>;
  // optional: handlers(): Record<string, RouteHandler>;
}

// Logging: request-scoped
interface ILogging {
  getLogger(): Logger;  // bound to request context when inside withRequestContext
}

// Middleware: chain
interface IMiddlewareChain {
  use(middleware: NextJsMiddleware): void;
  run(request: NextRequest): Promise<NextResponse>;
}

// Route define: registry
interface IRouteRegistry {
  defineRoute(def: RouteDef): void;
  getRoute(name: string): RouteDef | undefined;
  getRoutes(): RouteDef[];
}

// Annotations: metadata for routes/handlers
interface IAnnotations {
  getRouteMetadata<T>(routeId: string, key: symbol): T | undefined;
  setRouteMetadata(routeId: string, key: symbol, value: unknown): void;
}

// Lifecycle
interface IInitShutdown {
  onInit(fn: () => Promise<void>): void;
  onShutdown(fn: () => Promise<void>): void;
  runInit(): Promise<void>;
  runShutdown(): Promise<void>;
}

// Facade returned by factory
interface INextApp {
  request: IRequestHelpers;
  response: IResponseHelpers;
  api: IAppApi;
  logging: ILogging;
  middleware: IMiddlewareChain;
  routes: IRouteRegistry;
  annotations: IAnnotations;
  lifecycle: IInitShutdown;
}
```

## Factory usage (example)

```ts
import { createNextApp } from "@simpill/nextjs.utils/server";

const app = createNextApp({
  request: { getHeaders: () => headers() },
  logging: { getLogger: () => createClassLogger("App") },
});

// In route handlers / server actions:
export async function GET(req: Request) {
  await app.request.withRequestContext(async () => {
    const logger = app.logging.getLogger();
    const parsed = app.request.parseSearchParams(req, paginationSchema);
    if (!parsed.success) return app.response.errorResponse(parsed.error, 400);
    const data = await fetchData(parsed.data);
    return app.response.jsonResponse(data);
  });
}

// Init (e.g. instrumentation.ts)
await app.lifecycle.runInit();

// Shutdown (e.g. in custom server or process handler)
process.on("SIGTERM", () => app.lifecycle.runShutdown());
```

## Implementation notes

- **nextjs.utils** can implement the interfaces by delegating to existing helpers (createSafeAction, parseSearchParams, jsonResponse, errorResponse, withRequestContext, withCorrelation). Add `createNextApp(options)` that returns an object implementing `INextApp`.
- **Route define** – In-memory registry of `{ path, method, schema?, metadata? }`; no need to own file-based routing. Optional: generate `route.ts` stubs from registry.
- **Middleware** – Array of functions; single exported middleware runs the chain (withCorrelation first, then user middleware).
- **Annotations** – Use `@simpill/annotations.utils` with a store scoped to the app or a global store keyed by route id.
- **Logging** – Wire `setLogContextProvider(() => getRequestContext())` when creating the app so `getLogger()` returns a logger that includes request context.
- **Init / Shutdown** – Arrays of async functions; `runInit()` and `runShutdown()` run them in order (shutdown typically in reverse).

## Package dependencies

| Concern | Package |
|--------|---------|
| Request context | @simpill/request-context.utils |
| Validation | @simpill/zod.utils |
| Errors | @simpill/errors.utils |
| Middleware types / correlation | @simpill/middleware.utils, nextjs.utils/client (withCorrelation) |
| Annotations | @simpill/annotations.utils |
| Logging | @simpill/logger.utils |

## File layout (nextjs.utils)

- `src/shared/interfaces.ts` – IRequestHelpers, IResponseHelpers, IAppApi, ILogging, IMiddlewareChain, IRouteRegistry, IAnnotations, IInitShutdown, INextApp, RouteDef.
- `src/server/create-next-app.ts` – createNextApp(options) building the facade.
- `src/server/index.ts` – re-export createNextApp and interfaces.

No change to existing exports (createSafeAction, route-helpers, withRequestContext, etc.); the factory composes them behind the new interfaces.
