## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2frequest-context.utils.svg)](https://www.npmjs.com/package/@simpill/request-context.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-request-context.utils)
</p>

**npm**
```bash
npm install @simpill/request-context.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-request-context.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-request-context.utils` or `npm link` from that directory.

---

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

- **RequestContext** — `{ requestId?, traceId?, spanId?, userId?, sessionId?, tenantId?, [key: string]: unknown }`. All getters/run helpers accept a type parameter for custom shapes: `getRequestContext<AppContext>()`.
- **createRequestContextStore\<T\>()** — Returns a new store (AsyncLocalStorage-backed) with `run`, `runAsync`, `getStore`, `update`, `runWithChild`, `bind`.
- **runWithRequestContext(context, fn)** — Runs `fn` (sync or async) with `context`; always returns a Promise. A synchronous throw inside `fn` becomes a rejection.
- **runWithRequestContextSync(context, fn)** — Synchronous variant: returns `fn`'s value directly, no Promise allocation (15.8x faster for sync fns, interleaved medians, Node 22).
- **getRequestContext()** — Returns the current context or `undefined`.
- **requireRequestContext()** — Returns the current context or throws `RequestContextUnavailableError`.
- **updateRequestContext(patch)** — Shallow-merges `patch` into the current context **in place**, visible to all readers in the run (add `userId` after auth, etc.). Returns `false` outside a run.
- **setRequestContextValue(key, value)** / **getRequestContextValue(key)** — Single-key convenience forms.
- **runWithChildRequestContext(patch, fn)** — Runs `fn` with a child context: inherits the current context's fields (shallow copy, never aliased) with `patch` on top; parent is restored after.
- **bindRequestContext(fn)** — Captures the current context and returns a function that always runs `fn` inside it. Fixes EventEmitter listeners / queued callbacks that fire after the run.
- **RequestContextUnavailableError** — Thrown by `requireRequestContext()` outside a run.

The **default store is process-global** (anchored on a `Symbol.for()` registry key), so duplicate copies of this package in one process — npm dedupe failures, monorepo double-installs — share one store instead of silently splitting context.

### AsyncLocalStorage caveats

Context is tied to the **async execution** that started in `runWithRequestContext`. It is **not** automatically visible in work started outside that chain (e.g. a callback scheduled with `setTimeout` from another module, or a Worker thread) — wrap such callbacks with **bindRequestContext(fn)** to carry the context along, or pass it explicitly. **Nested** `runWithRequestContext` creates a new context that **shadows** the outer one for the duration of the inner `fn`; use **runWithChildRequestContext** when the inner scope should inherit the outer fields.

### Client / undefined behavior

The **client** entry point does not use AsyncLocalStorage (not available in browser/Edge). It mirrors the **full server API surface** so isomorphic code can import the same names from either entry: `run*` helpers execute `fn` without installing context, getters return **undefined**, mutators are no-ops returning **false**, `bindRequestContext` is identity, and `requireRequestContext` always throws. Use the **server** entry in Node so context is set by middleware and available down the call stack.

### Update / merge

- **updateRequestContext(patch)** shallow-merges into the current context object in place — the enrichment pattern: middleware sets `requestId`, the auth guard later adds `userId`, and every log line after (and code that grabbed the context earlier) sees it.
- **runWithChildRequestContext(patch, fn)** creates a scoped child: a fresh object inheriting the parent's fields with `patch` on top. The parent is never aliased or mutated and is restored when `fn` completes.

### OpenTelemetry

Use **traceId** and **spanId** from your OpenTelemetry context and pass them into **RequestContext** when calling **runWithRequestContext** (e.g. in middleware that reads from `span.context()`). This package does not integrate with OTel’s context propagation; it only provides a simple ALS-backed store. For full OTel propagation use `@opentelemetry/api` and its context.

### Merge / override semantics

**runWithRequestContext(context, fn)** installs that **context** for the duration of **fn** — no merge with the parent. Nested runs replace the visible context inside `innerFn` and restore the outer one after. When the inner scope should **inherit** the parent's fields, use **runWithChildRequestContext(patch, fn)**.

### Node version

**AsyncLocalStorage** is from `node:async_hooks`. This package requires **Node.js >= 16** (see `engines` in package.json).

### Express and Koa examples

**Express:** Wrap `next()` in the run — ALS propagates into every handler `next()` invokes, including all their async continuations. Do **not** pass anything to `next()` (Express treats any argument as an error and routes the request to your error handler):

```ts
import { runWithRequestContextSync } from "@simpill/request-context.utils/server";

app.use((req, res, next) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  const traceId = (req.headers["x-trace-id"] as string) || requestId;
  runWithRequestContextSync({ requestId, traceId }, () => next());
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

- **OpenTelemetry context propagation** — This package is a simple ALS-backed store. Pass **traceId** / **spanId** from OTel into **RequestContext** in middleware; for full OTel propagation use **@opentelemetry/api**.
- **Real context in client / Edge** — No AsyncLocalStorage in browser/Edge; the client entry ships API-compatible no-op stubs (see above).

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
- `@simpill/request-context.utils/server` — Node store + helpers
- `@simpill/request-context.utils/client` — API-compatible no-op stubs for browser/Edge
- `@simpill/request-context.utils/shared` — RequestContext type + RequestContextUnavailableError

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | runWithRequestContext, getRequestContext |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
