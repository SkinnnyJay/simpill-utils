# @simpill/api.utils

**Typed API client with Zod validation, handler registry, and middleware.**

Typed API client with Zod validation, handler registry, and middleware.

**Features:** Type-safe · Node & Edge · Zod · Tree-shakeable

## Installation

```bash
npm install @simpill/api.utils
```

## Usage

### Subpath exports

```ts
import { createApiFactory, fetchWithRetry, fetchWithTimeout } from "@simpill/api.utils";
import type { ApiRouteDef, ApiSchema, RetryOptions } from "@simpill/api.utils/shared";
// Server-only (full API)
import { createApiFactory } from "@simpill/api.utils/server";
```

### Fluent builder: define routes

```ts
import { createApiFactory } from "@simpill/api.utils";
import { z } from "zod";

const api = createApiFactory({ baseUrl: "https://api.example.com" })
  .route("/users/:id", "getUser")
  .get({
    params: z.object({ id: z.string().uuid() }),
    response: z.object({ id: z.string(), name: z.string() }),
  })
  .route("/users", "createUser")
  .post({
    body: z.object({ name: z.string() }),
    response: z.object({ id: z.string(), name: z.string() }),
  });
```

Route keys default to `METHOD:path` (e.g. `GET:/users/:id`); pass a second argument to `route(path, name)` for a custom key (e.g. `getUser`).

### Typed fetch client

```ts
const client = api.client({
  baseUrl: "https://api.example.com",
  headers: { "X-API-Key": "..." },
  timeoutMs: 5000,
  retry: { maxRetries: 3, delayMs: 100 },
});
const user = await client.getUser({ params: { id: "..." } });
const created = await client.createUser({ body: { name: "Jane" } });
```

Use `timeoutMs` and `retry` for built-in timeout and retries.

### Handler registry

```ts
const api = createApiFactory()
  .route("/users/:id", "getUser")
  .get(
    { params: z.object({ id: z.string() }), response: z.object({ id: z.string() }) },
    (ctx) => ({ id: ctx.params.id }),
  );
const handlers = api.handlers();
const result = await handlers.getUser({ url: "http://_/users/abc", method: "GET" });
```

Only routes that were defined with a handler appear in `handlers()`.

### Middleware

Attach `before`, `after`, `onError` globally (in `createApiFactory({ middleware })`) or per-route (`.withMiddleware({ before, after, onError })`). Order: global before → route before → handler → route after → global after; any `onError` runs when something throws.

### Retry and timeout

```ts
import { fetchWithRetry, fetchWithTimeout } from "@simpill/api.utils";

const res = await fetchWithRetry(url, init, { maxRetries: 3, delayMs: 100, fetcher });
const res2 = await fetchWithTimeout(url, init, { timeoutMs: 5000, fetcher });
```

### OpenAPI generation

This package does **not** generate OpenAPI/Swagger specs. Define routes and Zod schemas in code; for OpenAPI use a dedicated tool (e.g. **zod-to-openapi**, or hand-maintain a spec) and keep it in sync with your **createApiFactory** routes.

### Client entry usage

The **client** subpath (**@simpill/api.utils/client**) exports an empty object. It is for environments that resolve **client** first (e.g. some bundlers) so they don’t pull server-only code. The **typed fetch client** is created with **api.client({ baseUrl, headers, ... })** from the factory; create the factory and call **api.client()** in server or in a build step that runs in Node. For browser-only usage, build the client once (e.g. in a script) and pass the resulting **client** object or use **@simpill/api.utils** and rely on tree-shaking.

### Typing client and handler results

**api.client()** returns an object whose methods are typed as **Promise&lt;unknown&gt;** unless your route definitions use Zod **response** schemas; the factory infers from those when possible. **api.handlers()** returns a map of handler functions; request/response bodies are **unknown** at the type level. For type-safe call sites, define your routes with Zod schemas and use the inferred types, or assert/narrow at the call site (e.g. `const data = await client.getUser(...) as User` when you control the API).

### Error response shape

The **client** does not return a Result type. On **!res.ok** it throws **Error(`HTTP ${res.status}: ${text}`)**. After **res.json()**, if a **response** schema is set, **schema.parse(raw)** is used; **parse** throws **ZodError** on validation failure. So both HTTP and validation errors are **thrown**; catch them and map to your app’s error shape (e.g. **@simpill/errors.utils** or a standard API error body) if needed.

### Interceptors and hooks

There are no separate “interceptors.” Use **middleware** (global in **createApiFactory({ middleware })**, or per-route with **.withMiddleware({ before, after, onError })**). **before** can mutate the request context; **after** can mutate the response; **onError** runs when the handler or middleware throws. For logging, auth, or response shaping, use these hooks.

### Middleware ordering

Order of execution: **global before** → **route before** → **handler** → **route after** → **global after**. If any step throws, **route onError** runs first, then **global onError**; then the error is rethrown. So route middleware is “closer” to the handler than global middleware.

### File upload

There are **no** file-upload helpers. The client sends **body** as **JSON.stringify(body)** with **Content-Type: application/json**. For multipart or binary uploads, use a custom **fetcher** in **api.client({ fetcher })** or call fetch outside the client.

### Express / Fastify

There are **no** framework adapters. Use **api.handlers()** to get a map of handler functions, then in your Express/Fastify route call the appropriate handler with **{ url: req.url, method: req.method, headers, body }**. Example (Express): **app.get("/users/:id", (req, res) => handlers.getUser({ url: req.originalUrl, method: "GET", headers: req.headers as Record<string, string>, body: req.body }).then(r => res.json(r)).catch(e => res.status(500).json({ error: e.message }))** (adapt to your error format).

### Zod failure example

When the **response** schema fails, **responseSchema.parse(raw)** throws a **ZodError**. Catch it to return a 400/422 or a structured error body:

```ts
try {
  const data = await client.getUser({ params: { id } });
  return data;
} catch (err) {
  if (err instanceof z.ZodError) {
    return { ok: false, errors: err.flatten() };
  }
  throw err;
}
```

### baseUrl and headers

**api.client({ baseUrl, headers, ... })** uses **baseUrl** with a trailing slash removed, then builds URLs as **baseUrl + path + query**. If you omit **baseUrl** in **createApiFactory**, the default is an empty string; pass **baseUrl** in **createApiFactory({ baseUrl: "..." })** or in each **api.client({ baseUrl })** so requests use the correct origin. **headers** are merged: **defaultHeaders** (from **createApiFactory**) then **opts.headers** then per-call **options.headers** in each client method. **Content-Type: application/json** is set by the client unless overridden.

### Comparison with tRPC / zodios

This package is a **lightweight typed API** with Zod schemas and a fluent route definition. **tRPC** is RPC-style with its own transport and subscriptions; use tRPC for full-stack TypeScript RPC. **zodios** is similar (Zod + HTTP client/server); api.utils is minimal and fits the @simpill stack (http.utils, middleware.utils, request-context). Choose by need for OpenAPI, RPC, or framework integration.

### What we don't provide

- **OpenAPI generation** — No spec generation; use **zod-to-openapi** or hand-maintain a spec and keep it in sync.
- **File upload** — Client sends JSON; for multipart/binary use a custom **fetcher** or fetch outside the client.
- **Framework adapters** — No Express/Fastify bindings; use **api.handlers()** and wire routes yourself (pass **url**, **method**, **headers**, **body** into the handler). Handler context **headers** are typed as **Record<string, string>**; if your request has headers with array or non-string values, normalize to strings before passing to handlers.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Typed REST client + Zod validation | Use **createApiFactory** and **api.client()** with **baseUrl** and **headers**. |
| Server-side handler registry | Use **api.handlers()** and call handlers from Express/Fastify/Koa. |
| Global or per-route hooks | Use **middleware** (before/after/onError) at factory or **.withMiddleware()**. |
| OpenAPI / codegen | Use a separate OpenAPI tool; this package doesn’t generate specs. |
| File upload / non-JSON | Use a custom **fetcher** or fetch outside the client. |

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createApiFactory, route, Zod schemas, typed client |

## Development

From `utils/api.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/@simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/@simpill/blob/main/docs/PACKAGE_README_STANDARD.md).
