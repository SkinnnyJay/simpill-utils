## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fmiddleware.utils.svg)](https://www.npmjs.com/package/@simpill/middleware.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-middleware.utils)
</p>

**npm**
```bash
npm install @simpill/middleware.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-middleware.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-middleware.utils` or `npm link` from that directory.

---

## Usage

```ts
import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import { createCorrelationMiddleware } from "@simpill/middleware.utils/server";

const correlationMiddleware = createCorrelationMiddleware({
  requestIdHeader: CORRELATION_HEADERS.REQUEST_ID,
  traceIdHeader: CORRELATION_HEADERS.TRACE_ID,
  generateRequestId: () => crypto.randomUUID(),
});

// Express
app.use(correlationMiddleware);

// Fastify: wrap (req, res, next) to (request, reply, done)
```

Use **CORRELATION_HEADERS** from `@simpill/protocols.utils` for consistent header names across nextjs.utils, request-context.utils, and logging.

The middleware reads requestId/traceId from headers (if present), otherwise generates requestId via options.generateRequestId (default: uuid v4), runs the chain inside runWithRequestContext, and sets response headers.

## API

- **createCorrelationMiddleware(options?)** — Returns Middleware; options: requestIdHeader, traceIdHeader, generateRequestId, trustIncomingIds, isValidId, useTraceparent, setResponseHeaders.
- **compose(middlewares)** — Returns a single Middleware that runs the array in order, with Express-style `next(err)` propagation and a koa-compose-style guard against `next()` being called multiple times.
- **parseTraceparent(value)** — Parse a W3C Trace Context `traceparent` header; returns `{ version, traceId, parentId, traceFlags, sampled }` or `undefined` for anything the spec says to ignore (malformed, version `ff`, all-zero ids).
- **Middleware, Next, ErrorMiddleware, HeadersLike, MiddlewareRequest, MiddlewareResponse, TraceparentData** — Shared types.

### Compose helper

**compose(middlewares)** returns a single middleware that runs the array in order; each middleware receives a **next** that invokes the next in the chain. Use when stacking multiple middlewares into one (e.g. for a custom pipeline or testing). With Express you can also chain by registering in order: `app.use(m1); app.use(m2);`.

Semantics:

- **Errors propagate.** `next(err)` with a truthy argument skips the remaining composed middlewares and forwards the argument to the terminal `next` — exactly what Express does. Router sentinels (`next("route")`) are forwarded the same way. Falsy arguments (`next()`, `next(null)`) continue the chain.
- **Double `next()` is caught.** Calling `next()` more than once from the same middleware rejects with `"next() called multiple times"` (koa-compose behavior) instead of re-running downstream middlewares and the terminal `next` — the classic double-response bug.
- **Sync throws stay synchronous.** Express 4 catches synchronous throws and routes them to error handlers; compose does not convert them into rejections. Async rejections propagate through the returned promise when middlewares `await next()`.
- **The array is snapshotted.** Mutating it after `compose(...)` does not change the composed chain.
- Passing a non-array or a non-function element throws a `TypeError` at compose time.

```ts
import { compose, type Middleware } from "@simpill/middleware.utils";

const stack = compose([m1, m2, m3]);
app.use(stack);
```

### Framework adapters

The middleware signature is **(req, res, next)** with **req.headers** and **res.setHeader(name, value)**. **Express** matches: use `app.use(correlationMiddleware)`. **Fastify** uses **(request, reply, done)** and **reply.header(name, value)**; wrap so the middleware sees a res with setHeader:

```ts
fastify.addHook("onRequest", (request, reply, done) => {
  const req = { headers: request.headers };
  const res = { setHeader: (name: string, value: string) => reply.header(name, value) };
  createCorrelationMiddleware()(req, res, done);
});
```

**Koa** and others: adapt (ctx, next) by building a req/res that matches the types and calling the middleware with a next that calls `await next()`.

### Error middleware typing

Error-handling middleware that takes **(err, req, res, next)** is exported as the **ErrorMiddleware** type. compose does not invoke it (that is framework territory) — register it with your framework after the normal chain. Inside a composed stack, `next(err)` short-circuits the remaining composed middlewares and hands `err` to the terminal `next`, so Express routes it to your error middleware as usual.

### Context typing

**Middleware** is generic: **Middleware&lt;Req, Res&gt;** with default **MiddlewareRequest** and **MiddlewareResponse**. Extend those interfaces for your framework (e.g. add **req.user**, **res.statusCode**) and type your middleware as **Middleware&lt;MyRequest, MyResponse&gt;** so **createCorrelationMiddleware** remains **Middleware&lt;MiddlewareRequest, MiddlewareResponse&gt;** and is assignable when your req has **headers** and res has **setHeader**.

### Header override rules

The correlation middleware **sets** response headers for **requestId** and **traceId** (via **res.setHeader** with the configured header names). It does **not** read existing response headers; it overwrites (or adds) those two. If your framework merges multiple **setHeader** calls for the same name, the last one wins unless the framework documents otherwise.

### OpenTelemetry

**createCorrelationMiddleware** only sets **requestId** and **traceId** from request headers or generation. To use **OpenTelemetry** trace/span ids, add a middleware that reads from `span.context()` (or your OTel API), then runs **runWithRequestContext({ requestId, traceId, spanId: span.spanContext().spanId, ... }, () => next())**. You can run that **before** or **instead** of the correlation middleware, or combine both (e.g. prefer OTel trace id as traceId when present).

### Fastify example

See **Framework adapters** above: use **onRequest** and a **res** object that delegates **setHeader** to **reply.header**.

### Next.js / Edge

In **Next.js** API routes (App Router or Pages) and **Edge** runtimes there is no **(req, res, next)** stack. Call **runWithRequestContext** at the start of your handler with context you build (e.g. from headers or **crypto.randomUUID()**), then run your logic inside that callback. **createCorrelationMiddleware** is intended for Node server frameworks (Express, Fastify, Koa); for Next.js/Edge, use **@simpill/request-context.utils** directly in the route handler.

### Logger and request context

Use **@simpill/logger.utils** with **setLogContextProvider(() => getRequestContext())** so every log gets **requestId** and **traceId**. Register **createCorrelationMiddleware** early so **runWithRequestContext** runs for every request; then handlers and services that call **getRequestContext()** (or the logger) will see the same ids.

### Header casing

Incoming headers are read in a **case-insensitive** way (lookup uses lowercase first, then the original key). Response headers are set with the **exact** names you pass in options (e.g. **requestIdHeader: CORRELATION_HEADERS.REQUEST_ID** from `@simpill/protocols.utils`); HTTP header names are case-insensitive but the string you provide is what **setHeader** receives.

### Incoming id validation (security)

Client-supplied `x-request-id` / `x-trace-id` values are untrusted input. By default the middleware only accepts ids of 1–128 characters from `[A-Za-z0-9._~-]` (covers UUID, ULID, KSUID, base62 and base64url ids); anything else — oversized values, whitespace, control characters, log-delimiter payloads — is **discarded and replaced with a generated id**, never reflected into response headers, the request context, or your logs. Tune with:

- **isValidId(id)** — replace the default validator.
- **trustIncomingIds: false** — never accept client ids at all (Envoy-style edge sanitization); every request gets a fresh generated id.

### W3C traceparent

When the trace-id header is absent, the middleware falls back to the [W3C Trace Context](https://www.w3.org/TR/trace-context/) `traceparent` header (the format OpenTelemetry propagates). On a valid header the context gets **traceId** (the 32-hex trace-id) and **spanId** (the 16-hex parent-id); malformed values, version `ff`, and all-zero ids are ignored per spec. Disable with **useTraceparent: false**. An explicit trace-id header always wins (backward compatible). `parseTraceparent` is exported if you need the parser directly.

### Edge / Fetch Headers

`req.headers` may be either the Node-style plain record or a Fetch-API `Headers` object (`.get(name)`), so the correlation middleware works in Edge-style hooks too — matching the package description ("Node and Edge").

### What we don't provide

- **A middleware runner.** compose returns a middleware; something (your framework, or your own call) still has to invoke it.
- **Error middleware execution.** The **ErrorMiddleware** type `(err, req, res, next)` is exported for convenience, but compose never invokes error middlewares — register them with your framework after the normal chain.
- **A full Next.js / Edge middleware stack.** There is no (req, res, next) pipeline in those runtimes; call **runWithRequestContext** in the route handler. createCorrelationMiddleware does, however, read ids from Fetch-API `Headers` objects if you adapt it into an Edge-style hook.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Express / Fastify / Koa with (req, res, next) | Use **createCorrelationMiddleware** from **server**; adapt for Fastify (see above). |
| Request-scoped logging | Combine with **setLogContextProvider(getRequestContext)** and **runWithRequestContext** so logs include requestId/traceId. |
| Next.js / Edge API routes | Use **runWithRequestContext** in the handler; no (req, res, next) middleware. |
| Custom Req/Res types | Use **Middleware&lt;MyReq, MyRes&gt;** and ensure req has **headers**, res has **setHeader**. |
| Chaining many middlewares | Use **compose(middlewares)** (error-propagating, double-next guarded) or the framework's **app.use** order. |

Subpaths: `@simpill/middleware.utils`, `./client` (types only), `./server`, `./shared`.

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createCorrelationMiddleware, requestId/traceId, getRequestContext in handler |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
