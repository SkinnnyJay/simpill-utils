## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fobservability.utils.svg)](https://www.npmjs.com/package/@simpill/observability.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-observability.utils)
</p>

**npm**
```bash
npm install @simpill/observability.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-observability.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-observability.utils` or `npm link` from that directory.

---

## Recommended integration

```ts
import {
  createCorrelationMiddleware,
  setupObservability,
} from "@simpill/observability.utils/server";

// Once at startup: wire request context into logger so every log includes requestId/traceId.
// Returns a handle; baseContext is merged into every entry (request fields win on conflict).
const observability = setupObservability({ baseContext: { service: "checkout", env: process.env.NODE_ENV } });

// Use the correlation middleware in your stack (sets requestId/traceId and runs handler in context)
app.use(createCorrelationMiddleware());

// On shutdown / hot-reload:
observability.teardown();
```

After `setupObservability()`, any code that runs inside `createCorrelationMiddleware` (or inside `runWithRequestContext` from `@simpill/request-context.utils`) will have its logs automatically enriched with `requestId`, `traceId`, etc. when using `@simpill/logger.utils`.

### Continuing a W3C trace from inbound headers

`traceContextFromHeaders` bridges an incoming `traceparent` / `tracestate` into the request
context — no OpenTelemetry SDK required:

```ts
import { setupObservability, traceContextFromHeaders } from "@simpill/observability.utils/server";
import { runWithRequestContext } from "@simpill/request-context.utils/server";

setupObservability({ baseContext: { service: "checkout" } });

function handler(req, res) {
  const trace = traceContextFromHeaders(req.headers); // continues a valid trace, or starts a new one
  runWithRequestContext({ requestId: req.id, ...trace }, () => {
    // every log in here carries service, requestId, traceId, spanId, sampled, tracestate
    handleRequest(req, res);
  });
}
```

## API

### setup

- **setupObservability(options?): ObservabilityHandle** — installs a logger context provider so
  logs pick up request context. Returns a handle with `teardown()`, `active`, and
  `replacedExistingProvider`.
  - `setLogContextProvider?: boolean` (default `true`) — when `false`, installs nothing and returns
    an inactive handle.
  - `baseContext?: LogContext` — static fields (service, env, region, …) merged into every entry,
    even outside a request. Request-scoped fields win on key conflict. Copied on setup.
  - `extendContext?: () => LogContext | undefined` — dynamic fields composed on every log call
    (e.g. an OTel span bridge). Merged between `baseContext` and the request context. Errors thrown
    here are swallowed by the logger's context read, never by the log call.
  - `onExistingProvider?: "replace" | "keep" | "throw"` (default `"replace"`) — behavior when another
    provider is already installed. `"replace"` matches the previous silent-overwrite behavior but now
    reports it via `handle.replacedExistingProvider`.
- **createCorrelationMiddleware(options?)** — re-exported from `@simpill/middleware.utils`. Sets
  `x-request-id` / `x-trace-id` from headers or generates them, and runs the chain inside
  `runWithRequestContext`.

### W3C Trace Context

Zero-dependency (`node:crypto` only), spec-compliant
[W3C Trace Context](https://www.w3.org/TR/trace-context/) helpers, including the Level 2
random-trace-id flag:

- **traceContextFromHeaders(headers, options?)** — extract trace context from an inbound header map,
  ready to spread into `runWithRequestContext`. Continues a valid inbound `traceparent` (preserving
  `tracestate`); an invalid or missing one starts a new trace and discards `tracestate`, per the
  spec's processing model. `options.generateIfMissing` (default `true`).
- **parseTraceparent(header)** — parse/validate a `traceparent` value, returning `null` for any
  invalid header. Enforces lowercase-hex, all-zero rejection, version-`ff` rejection, exact
  version-00 length, and forward-compatible parsing of future versions.
- **formatTraceparent(input)** — serialize a version-00 `traceparent`; zeroes unknown flag bits on
  output and throws `TypeError` on invalid ids rather than emitting a header downstream parsers would
  silently drop.
- **generateTraceId() / generateSpanId()** — CSPRNG ids, never all-zeros.
- **isValidTraceId(v) / isValidSpanId(v)** — type-guard validators.
- **TRACE_FLAG_SAMPLED / TRACE_FLAG_RANDOM_TRACE_ID** — trace-flags bit constants.

### What we don't provide

- **Full metrics / span tracing** — correlation (requestId/traceId), logger context, and W3C
  trace-header propagation only; no metric instruments or span export. Use **OpenTelemetry** or your
  APM for those. `extendContext` gives you a hook to bridge an active OTel span into log context if
  you do run the SDK.
- **Client-side** — **setupObservability** and **createCorrelationMiddleware** are server-only (Node);
  for browser logging use **@simpill/logger.utils** with a client adapter.

## Subpath exports

- `@simpill/observability.utils` — all (server)
- `@simpill/observability.utils/server` — setupObservability + createCorrelationMiddleware

## Dependencies

This package depends on `@simpill/logger.utils`, `@simpill/middleware.utils`, and `@simpill/request-context.utils`. Install them (or the whole monorepo) as needed. In monorepo development, if `npm install` fails due to git hook scripts, run `npm install --ignore-scripts` from the repo root, then build dependency packages before building this one.
