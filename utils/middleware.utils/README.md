# @simpill/middleware.utils

**Framework-agnostic middleware types and correlation ID middleware.**

Framework-agnostic middleware types and correlation ID middleware.

**Features:** Type-safe · Node & Edge · Uses `@simpill/request-context.utils` and `@simpill/uuid.utils`

## Installation

```bash
npm install @simpill/middleware.utils @simpill/request-context.utils @simpill/uuid.utils
```

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

- **createCorrelationMiddleware(options?)** — Returns Middleware; options: requestIdHeader, traceIdHeader, generateRequestId.
- **compose(middlewares)** — Returns a single Middleware that runs the array in order.
- **Middleware, Next, MiddlewareRequest, MiddlewareResponse** — Shared types.

### Compose helper

**compose(middlewares)** returns a single middleware that runs the array in order; each middleware receives a **next** that invokes the next in the chain. Use when stacking multiple middlewares into one (e.g. for a custom pipeline or testing). With Express you can also chain by registering in order: `app.use(m1); app.use(m2);`.

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

Error-handling middleware that takes **(err, req, res, next)** is **not** part of this package. The **Middleware** type is **(req, res, next)** only. For error middleware use your framework’s types or define `MiddlewareError = (err: Error, req, res, next: Next) => void | Promise<void>` and register it after normal middleware.

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

### What we don't provide

- **compose** — No middleware composition helper; chain via your framework (**app.use(m1); app.use(m2)**) or manual **next** wrapping.
- **Error middleware type** — **Middleware** is **(req, res, next)** only; for **(err, req, res, next)** define your own type and register with the framework.
- **Next.js / Edge** — No **(req, res, next)** stack there; use **runWithRequestContext** from **@simpill/request-context.utils** in the route handler.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Express / Fastify / Koa with (req, res, next) | Use **createCorrelationMiddleware** from **server**; adapt for Fastify (see above). |
| Request-scoped logging | Combine with **setLogContextProvider(getRequestContext)** and **runWithRequestContext** so logs include requestId/traceId. |
| Next.js / Edge API routes | Use **runWithRequestContext** in the handler; no (req, res, next) middleware. |
| Custom Req/Res types | Use **Middleware&lt;MyReq, MyRes&gt;** and ensure req has **headers**, res has **setHeader**. |
| Chaining many middlewares | Use framework’s **app.use** order; no compose helper in this package. |

Subpaths: `@simpill/middleware.utils`, `./client` (types only), `./server`, `./shared`.

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createCorrelationMiddleware, requestId/traceId, getRequestContext in handler |

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/@simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/@simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

## License

ISC
