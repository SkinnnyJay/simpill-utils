# @simpill/nextjs.utils

Next.js App Router helpers: type-safe server actions (Zod), route handler utilities, request context, and middleware correlation. Composes with `@simpill/zod.utils`, `@simpill/errors.utils`, and `@simpill/request-context.utils`.

## Installation

```bash
npm install @simpill/nextjs.utils @simpill/zod.utils @simpill/errors.utils @simpill/request-context.utils
```

## Usage

### Subpath exports

```ts
import { createSafeAction, withRequestContext } from "@simpill/nextjs.utils";
import { withCorrelation } from "@simpill/nextjs.utils/client";
import type { ActionResult } from "@simpill/nextjs.utils/shared";
```

### createSafeAction

Wraps a server function with Zod input validation; returns `{ data, error }` (errors as data).

```ts
"use server";
import { z } from "zod";
import { createSafeAction } from "@simpill/nextjs.utils";

const Schema = z.object({ name: z.string().min(1) });
export const submitAction = createSafeAction(Schema, async (input) => {
  return { id: "1", name: input.name };
});

// In a client component:
// const result = await submitAction({ name: "x" });
// if (result.error) { ... } else { result.data }
```

### Route Handlers: parseSearchParams, jsonResponse, errorResponse

```ts
import { parseSearchParams, jsonResponse, errorResponse } from "@simpill/nextjs.utils/server";
import { paginationSchema } from "@simpill/zod.utils";

export async function GET(request: Request) {
  const parsed = parseSearchParams(request, paginationSchema(100));
  if (!parsed.success) {
    return errorResponse(parsed.error, 400);
  }
  const { page, limit } = parsed.data;
  const data = await fetchItems(page, limit);
  return jsonResponse(data);
}
```

### withRequestContext

Run a handler inside request context (requestId/traceId from headers or generated).

```ts
import { withRequestContext, getRequestContext } from "@simpill/nextjs.utils/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  return withRequestContext(
    async () => {
      const ctx = getRequestContext();
      // use ctx.requestId, ctx.traceId
      return Response.json({ ok: true });
    },
    { getHeaders: () => headers() },
  );
}
```

### withCorrelation (middleware, Edge-safe)

Get correlation headers to set on the response. Use **CORRELATION_HEADERS** from `@simpill/protocols.utils` for consistent header names.

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import { withCorrelation } from "@simpill/nextjs.utils/client";

export function middleware(request: NextRequest) {
  const headers = withCorrelation(request);
  const res = NextResponse.next();
  res.headers.set(CORRELATION_HEADERS.REQUEST_ID, headers[CORRELATION_HEADERS.REQUEST_ID]);
  res.headers.set(CORRELATION_HEADERS.TRACE_ID, headers[CORRELATION_HEADERS.TRACE_ID]);
  return res;
}
```

### createNextApp

Returns an **INextApp**: route registry, middleware chain, request/response helpers, createSafeAction, logging, annotations, init/shutdown lifecycle. See [docs/NEXTJS_ENHANCED_APP_DESIGN.md](../../docs/NEXTJS_ENHANCED_APP_DESIGN.md) for design.

```ts
import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import { createNextApp } from "@simpill/nextjs.utils/server";

const app = createNextApp({
  requestIdHeader: CORRELATION_HEADERS.REQUEST_ID,
  traceIdHeader: CORRELATION_HEADERS.TRACE_ID,
  annotationsStore: myMetadataStore, // optional
  setLogContextProvider: setLogContextProvider, // optional, e.g. logger.utils
});

app.routes.define({ path: "/api/health", method: "GET" });
app.middleware.use((req, next) => next());
app.lifecycle.onInit(async () => { await db.connect(); });
app.lifecycle.onShutdown(async () => { await db.disconnect(); });
// In instrumentation.ts or custom server: await app.lifecycle.init();
// On SIGTERM: await app.lifecycle.shutdown();

// Use in route handlers:
// app.request.withRequestContext(async () => { ... });
// app.response.json(data);
// app.api.createSafeAction(schema, handler);
// app.logging.getLogger("api").info("request");
```

### Server module grouping

Server code is organized by concern: **route** (route-helpers, route-registry), **logging** (logging-adapter), **annotations** (annotations-adapter). Import from `@simpill/nextjs.utils/server`; symbols are re-exported from the main server index.

## API

| Export | Description |
|--------|-------------|
| `createNextApp(options?)` | Factory returning INextApp (routes, middleware, request, response, api, logging, annotations, lifecycle) |
| `createSafeAction(inputSchema, handler)` | Server action with Zod validation; returns `{ data?, error? }` |
| `parseSearchParams(request, schema)` | Parse and validate search params with Zod |
| `jsonResponse(data, status?)` | `Response` with JSON body |
| `errorResponse(err, status?)` | JSON error response (serializes for 5xx) |
| `withRequestContext(handler, options?)` | Run handler inside request context |
| `withCorrelation(request, options?)` | Read/generate x-request-id, x-trace-id (Edge-safe) |
| `createRouteRegistry()` | In-memory IRouteRegistry |
| `createMiddlewareChain()` | Composable IMiddlewareChain |
| `createInitShutdown()` | IInitShutdown (onInit, onShutdown, init(), shutdown()) |
| `createAnnotationsAdapter(store)` / `createNoopAnnotations()` | IAnnotations adapter |
| `createLoggingIntegration(options?)` | ILoggingIntegration (console + optional context provider) |

### What we don't provide

- **Pages Router** — Helpers target App Router (route handlers, server actions, middleware). For Pages Router use **@simpill/request-context.utils** and **@simpill/middleware.utils** in getServerSideProps/getInitialProps or adapt as needed.
- **Server actions without Zod** — **createSafeAction** requires a Zod input schema; for unvalidated actions wrap your handler yourself.
- **Edge runtime request context** — **withRequestContext** uses **headers()** (or options.getHeaders); in Edge, constraints apply (e.g. no dynamic APIs in some paths). Use **withCorrelation** in middleware for correlation headers when full ALS context is not available.
- **Full Next.js replacement** — We provide helpers and **createNextApp** facade; you still use Next.js for routing, RSC, and deployment.

## Development

From `utils/nextjs.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – full checks

## License

ISC
