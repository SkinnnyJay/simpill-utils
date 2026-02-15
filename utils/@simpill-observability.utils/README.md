<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/observability.utils" width="100%" />
</p>

<p align="center">
  <strong>Single integration surface for correlation, request context, and logger</strong>
</p>

<p align="center">
  Wire createCorrelationMiddleware, runWithRequestContext, and logger context in one place.
</p>

**Features:** Type-safe · Node · Lightweight

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#recommended-integration">Recommended integration</a>
</p>

---

## Installation

```bash
npm install @simpill/observability.utils
```

## Recommended integration

```ts
import {
  createCorrelationMiddleware,
  setupObservability,
} from "@simpill/observability.utils/server";

// Once at startup: wire request context into logger so every log includes requestId/traceId
setupObservability();

// Use the correlation middleware in your stack (sets requestId/traceId and runs handler in context)
app.use(createCorrelationMiddleware());
```

After `setupObservability()`, any code that runs inside `createCorrelationMiddleware` (or inside `runWithRequestContext` from `@simpill/request-context.utils`) will have its logs automatically enriched with `requestId`, `traceId`, etc. when using `@simpill/logger.utils`.

## API

- **setupObservability(options?)** — Calls `setLogContextProvider(() => getRequestContext())` so logger picks up request context. Options: `{ setLogContextProvider?: boolean }` (default true).
- **createCorrelationMiddleware(options?)** — Re-exported from `@simpill/middleware.utils`. Sets `x-request-id` / `x-trace-id` from headers or generates them, and runs the chain inside `runWithRequestContext`.

### What we don't provide

- **Metrics / tracing** — Correlation (requestId/traceId) and logger context only; no metrics, spans, or traces. Use **OpenTelemetry** or your APM in addition.
- **OpenTelemetry integration** — No OTel SDK wiring; pass **traceId** / **spanId** from OTel into **runWithRequestContext** in your middleware if you use OTel.
- **Client-side** — **setupObservability** and **createCorrelationMiddleware** are server-only (Node); for browser logging use **@simpill/logger.utils** with a client adapter.

## Subpath exports

- `@simpill/observability.utils` — all (server)
- `@simpill/observability.utils/server` — setupObservability + createCorrelationMiddleware

## Dependencies

This package depends on `@simpill/logger.utils`, `@simpill/middleware.utils`, and `@simpill/request-context.utils`. Install them (or the whole monorepo) as needed. In monorepo development, if `npm install` fails due to git hook scripts, run `npm install --ignore-scripts` from the repo root, then build dependency packages before building this one.
