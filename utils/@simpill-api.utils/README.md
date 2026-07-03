## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fapi.utils.svg)](https://www.npmjs.com/package/@simpill/api.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-api.utils)
</p>

**npm**
```bash
npm install @simpill/api.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-api.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-api.utils` or `npm link` from that directory.

---

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
// Fully inferred from the route's Zod schemas — no casts:
const user = await client.getUser({ params: { id: "..." } }); // { id: string; name: string }
const created = await client.createUser({ body: { name: "Jane" } });
```

Method names, option shapes (`params`/`query`/`body`), and return types are all inferred
from the route definitions. Wrong param types, missing required params, and unknown route
keys are compile errors. Path params are percent-encoded; a missing param throws
`ApiMissingParamError` instead of sending a literal `:id` to the server. Query values may
be arrays and serialize as repeated keys (`{ tag: ["a", "b"] }` → `tag=a&tag=b`).

Use `timeoutMs` and `retry` for built-in timeout and retries, and
`validateRequest: true` to also validate `params`/`query`/`body` against the route
schemas before sending (throws `ZodError` client-side).

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
import { fetchWithRetry, fetchWithTimeout, composeSignals } from "@simpill/api.utils";

const res = await fetchWithRetry(url, init, {
  maxRetries: 3,
  delayMs: 100,
  // opt-in: advanced knobs pass straight through to @simpill/http.utils
  policy: {
    retryableStatuses: (s) => [502, 503, 504].includes(s),
    backoffMultiplier: 2, // exponential
    jitter: true,         // full jitter: random(0, delay)
  },
  fetcher,
});
const res2 = await fetchWithTimeout(url, init, { timeoutMs: 5000, fetcher });
```

Retry defaults are unchanged (network errors only, fixed delay), but user aborts are never
retried and retry delays are abort-aware. `fetchWithRetry` delegates to
`@simpill/http.utils` `fetchWithRetry`; the `policy` option exposes its full
`HttpRetryPolicy` (Retry-After honoring, retryMethods, per-attempt timeoutMs, ...).
With status retries enabled, exhausting attempts throws instead of returning the
final response. Timeouts abort with an `ApiTimeoutError` whose
`name` is `"TimeoutError"`, so they're distinguishable from user aborts (`"AbortError"`).

If you pass your own `init.signal`, `fetchWithTimeout` keeps passing it through untouched
and enforces the timeout by rejecting the promise on expiry (the in-flight request itself
is not cancelled in that mode). Pass `composeSignal: true` — or compose yourself with the
exported `composeSignals(a, b)` — to have the timeout also cancel the request.

### OpenAPI generation

This package does **not** generate OpenAPI/Swagger specs. Define routes and Zod schemas in code; for OpenAPI use a dedicated tool (e.g. **zod-to-openapi**, or hand-maintain a spec) and keep it in sync with your **createApiFactory** routes.

### Client entry usage

The **client** subpath (**@simpill/api.utils/client**) exports the Edge-safe shared surface: all shared types plus the error classes (`ApiHttpError`, `ApiTimeoutError`, `ApiMissingParamError`, `ApiResponseParseError`, `ApiDuplicateRouteError`), so isomorphic code can do `err instanceof ApiHttpError` in a client bundle without pulling server-only code. The **typed fetch client** itself is created with **api.client({ baseUrl, headers, ... })** from the factory; create the factory and call **api.client()** in server or in a build step that runs in Node. For browser-only usage, build the client once (e.g. in a script) and pass the resulting **client** object or use **@simpill/api.utils** and rely on tree-shaking.

### Typing client and handler results

Everything is inferred — no call-site casts needed. **api.client()** methods take typed `params`/`query`/`body` (from `z.input` of each schema) and return `Promise<z.output<responseSchema>>` (or the `transform` return type when set). **api.handlers()** hands your handler a typed `ctx` (`ctx.params`, `ctx.query`, `ctx.body` from the schemas) and only routes defined **with** a handler exist on the returned map — accessing a handler-less route is a compile error. Routes without schemas stay `unknown`, exactly as before. Inference is compile-time only: dispatch benchmarks at parity with the untyped v1 client (0.99x).

### Error response shape

The **client** does not return a Result type. On **!res.ok** it throws **ApiHttpError** with `status`, `statusText`, `body`, `url`, `method`, and `routeKey` fields — the message stays `HTTP ${res.status}: ${text}`, so existing string matching keeps working, but you no longer have to regex the message for the status. If a 2xx response has a **non-empty** body that is not valid JSON, the client throws **ApiResponseParseError** (v1 silently coerced it to `{}`); empty bodies (204s) still parse to `{}`. If a **response** schema is set, **schema.parse(raw)** runs and throws **ZodError** on validation failure. All of these are **thrown**; catch and map to your app’s error shape (e.g. **@simpill/errors.utils**) if needed.

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

**api.client({ baseUrl, headers, ... })** uses **baseUrl** with a trailing slash removed, then builds URLs as **baseUrl + path + query**. If you omit **baseUrl** in **createApiFactory**, the default is an empty string; pass **baseUrl** in **createApiFactory({ baseUrl: "..." })** or in each **api.client({ baseUrl })** so requests use the correct origin. **headers** are merged case-insensitively: **defaultHeaders** (from **createApiFactory**) then **opts.headers** then per-call **options.headers** in each client method — later values win regardless of key casing, so `content-type` and `Content-Type` never produce duplicate headers. **Content-Type: application/json** is set by the client unless overridden (v1 claimed this but spread its default last, making an override impossible; now any caller-supplied content-type wins).

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

---