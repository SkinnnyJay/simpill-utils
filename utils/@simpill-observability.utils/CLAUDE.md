# CLAUDE.md – @simpill/observability.utils

## Purpose

Single integration surface that wires together structured logging, correlation middleware, and request context for Node.js applications. Consumers import one package instead of coordinating three.

## Commands

From `utils/@simpill-observability.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main / Server**: `@simpill/observability.utils` and `@simpill/observability.utils/server` – identical

| Export | Description |
|--------|-------------|
| `setupObservability` | Wires request context into the logger (handles, baseContext, extendContext, W3C-friendly) |
| `createCorrelationMiddleware` | Re-exported from `@simpill/middleware.utils/server` |
| `CreateCorrelationMiddlewareOptions` | Options type for `createCorrelationMiddleware` |

> **No client export.** All functionality requires Node.js.

## Usage Examples

```typescript
import { createCorrelationMiddleware, setupObservability } from "@simpill/observability.utils/server";

const obs = setupObservability({
  baseContext: { service: "api" },
  onExistingProvider: "replace",
});

app.use(createCorrelationMiddleware({ generateId: () => crypto.randomUUID() }));

// tests / hot-reload
obs.teardown();
```

## Architecture Notes

- **Runtime**: Node.js only (`server/`). No `client/` or `shared/` exports.
- `setupObservability` is **owned here** — it composes `@simpill/logger.utils` context providers with `@simpill/request-context.utils`.
- `server/index.ts` also re-exports `createCorrelationMiddleware` from middleware for a single import surface.

## Dependencies

| Package | Role |
|---------|------|
| `@simpill/logger.utils` | Log context provider APIs used by `setupObservability` |
| `@simpill/middleware.utils` | `createCorrelationMiddleware` re-export |
| `@simpill/request-context.utils` | AsyncLocalStorage request context |

## Key Design Decisions

- Keep integration logic in this package (not a thin facade) so logger stays free of request-context ownership.
- Prefer importing request-context helpers directly from `@simpill/request-context.utils` when you need more than logging glue.

Tests in `__tests__/server/unit/*.unit.test.ts`.
