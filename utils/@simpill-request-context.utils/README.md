# @simpill/request-context.utils

**AsyncLocalStorage request context (requestId, traceId) for Node.js.**

AsyncLocalStorage-based request ID and trace ID for logging and tracing. Compatible with `@simpill/logger.utils` LogContext.

**Features:** Type-safe · Node only · Lightweight

## Installation

```bash
npm install @simpill/request-context.utils
```

## Usage

### Server (Node.js)

```ts
import {
  runWithRequestContext,
  getRequestContext,
  createRequestContextStore,
} from "@simpill/request-context.utils/server";

// Wrap request handling so all code in the chain sees the same context
await runWithRequestContext(
  { requestId: "req-123", traceId: "trace-456" },
  async () => {
    // Anywhere in this async flow:
    const ctx = getRequestContext();
    console.log(ctx?.requestId); // "req-123"
  }
);

// Or use a store explicitly
const store = createRequestContextStore();
store.run({ requestId: "r1" }, () => {
  expect(store.getStore()?.requestId).toBe("r1");
});
```

### Logger integration

To have `@simpill/logger.utils` include request context in every log entry, set the log context provider to the request context getter:

```ts
import { setLogContextProvider } from "@simpill/logger.utils";
import { getRequestContext } from "@simpill/request-context.utils/server";

setLogContextProvider(() => getRequestContext());
```

Then run your request handlers with `runWithRequestContext` (e.g. from middleware), and all logs will automatically include `requestId`, `traceId`, etc.

### Client / Edge

`getRequestContext()` in the client entry point returns `undefined` (no AsyncLocalStorage in browser/edge). Use the server package in Node for real context.

## API

- **RequestContext** — `{ requestId?, traceId?, spanId?, userId?, sessionId?, tenantId?, [key: string]: unknown }`
- **createRequestContextStore()** — Returns a new store (AsyncLocalStorage-backed).
- **runWithRequestContext(context, fn)** — Runs `fn` with `context`; context is available via `getRequestContext()` for the whole sync/async execution.
- **getRequestContext()** — Returns the current context or `undefined`.

### AsyncLocalStorage caveats

Context is tied to the **async execution** that started in `runWithRequestContext`. It is **not** visible in work started outside that chain (e.g. a callback scheduled with `setTimeout` from another module, or a Worker thread). Pass context explicitly into such code or run the work inside a new `runWithRequestContext`. Also, **nested** `runWithRequestContext` creates a new context that **shadows** the outer one for the duration of the inner `fn`; when the inner fn completes, the outer context is visible again.

### Client / undefined behavior

The **client** entry point does not use AsyncLocalStorage (not available in browser/Edge). **getRequestContext()** from `@simpill/request-context.utils/client` always returns **undefined**. Use the **server** entry in Node so context is set by middleware and available down the call stack.

### Update / merge

There are no **update** or **merge** helpers. To “change” context, call **getRequestContext()**, build a new object (e.g. `{ ...current, userId: "x" }`), and run **runWithRequestContext(newContext, fn)** for the scope where the updated context should apply. Mutating the object returned by getRequestContext() is possible but not recommended (shared reference).

### OpenTelemetry

Use **traceId** and **spanId** from your OpenTelemetry context and pass them into **RequestContext** when calling **runWithRequestContext** (e.g. in middleware that reads from `span.context()`). This package does not integrate with OTel’s context propagation; it only provides a simple ALS-backed store. For full OTel propagation use `@opentelemetry/api` and its context.

### Merge / override semantics

**runWithRequestContext(context, fn)** installs that **context** for the duration of **fn**. There is no merge with a “parent” context. Nested **runWithRequestContext(innerContext, innerFn)** replaces the current context with **innerContext** inside **innerFn**; after **innerFn** returns, the previous (outer) context is restored.

### Node version

**AsyncLocalStorage** is from `node:async_hooks`. This package requires **Node.js >= 16** (see `engines` in package.json).

### Express and Koa examples

**Express:** The run must stay active for the whole request. Have the callback return a Promise that resolves when the response finishes so context is visible in all route handlers:

```ts
import { runWithRequestContext } from "@simpill/request-context.utils/server";

app.use((req, res, next) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  const traceId = (req.headers["x-trace-id"] as string) || requestId;
  runWithRequestContext({ requestId, traceId }, () =>
    new Promise<void>((resolve, reject) => {
      res.once("finish", () => resolve());
      res.once("close", () => resolve());
      next(reject);
    })
  ).catch(next);
});
```

**Koa:** Run the stack inside context and await `next()` so the promise (and thus the run) lasts for the whole request:

```ts
import { runWithRequestContext } from "@simpill/request-context.utils/server";

app.use((ctx, next) =>
  runWithRequestContext(
    {
      requestId: ctx.get("x-request-id") || crypto.randomUUID(),
      traceId: ctx.get("x-trace-id") || ctx.get("x-request-id") || crypto.randomUUID(),
    },
    () => next()
  )
);
```

### Nested run behavior

Calling **runWithRequestContext** again inside an already-running context **replaces** the visible context for the inner callback. When the inner callback finishes (sync or async), the outer context becomes visible again. No stacking or merging.

### Cleanup and leaks

AsyncLocalStorage does not require explicit cleanup; context is scoped to the run. Avoid storing the object returned by **getRequestContext()** in a long-lived closure or global that outlives the request, or you may retain request data and cause leaks or cross-request contamination.

### What we don't provide

- **Update / merge helpers** — No API to “patch” current context; build a new object (e.g. `{ ...getRequestContext(), userId: "x" }`) and call **runWithRequestContext(newContext, fn)** for the scope that should see the update.
- **OpenTelemetry context propagation** — This package is a simple ALS-backed store. Pass **traceId** / **spanId** from OTel into **RequestContext** in middleware; for full OTel propagation use **@opentelemetry/api**.
- **Context in client / Edge** — **getRequestContext()** from the client entry always returns **undefined** (no AsyncLocalStorage in browser/Edge).

### When to use

| Use case | Recommendation |
|----------|----------------|
| Node HTTP server (Express, Fastify, Koa) | Use **server** entry; set context in middleware with **runWithRequestContext** and read with **getRequestContext** in handlers and services. |
| Logger correlation | Set **setLogContextProvider** in logger.utils to **getRequestContext** so every log gets requestId/traceId. |
| Browser or Edge | Use **client** entry; **getRequestContext()** is always **undefined**—no AsyncLocalStorage. |
| Multiple stores | Call **createRequestContextStore()** and use **store.run** / **store.runAsync** and **store.getStore()** instead of the default store. |
| OpenTelemetry trace ids | Populate **traceId** / **spanId** from OTel in middleware and pass into **runWithRequestContext**. |

## Subpath exports

- `@simpill/request-context.utils` — all
- `@simpill/request-context.utils/server` — Node store and getter
- `@simpill/request-context.utils/client` — stub getter (returns undefined)
- `@simpill/request-context.utils/shared` — types only

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | runWithRequestContext, getRequestContext |

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

## License

ISC
