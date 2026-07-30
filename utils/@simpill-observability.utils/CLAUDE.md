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

| Export | Source package | Description |
|--------|---------------|-------------|
| `setupObservability` | `@simpill/logger.utils/server` | Configure and initialize structured logging |
| `createCorrelationMiddleware` | `@simpill/middleware.utils/server` | Framework-agnostic correlation header middleware |
| `CreateCorrelationMiddlewareOptions` | `@simpill/middleware.utils/server` | Options type for `createCorrelationMiddleware` |

> **No client export.** All functionality requires Node.js.

## Usage Examples

```typescript
import { createCorrelationMiddleware, setupObservability } from "@simpill/observability.utils/server";

// Initialize logger at startup
setupObservability({ level: "info", format: "json" });

// Wire correlation middleware (e.g. Express)
app.use(createCorrelationMiddleware({ generateId: () => crypto.randomUUID() }));
```

## Architecture Notes

- **Runtime**: Node.js only (`server/`). No `client/` or `shared/` exports.
- `setup-observability.ts` is a re-export facade — the implementation lives in `@simpill/logger.utils/server`. This keeps import paths stable if the underlying package changes.
- The `server/index.ts` re-exports both `setupObservability` (from `logger.utils`) and `createCorrelationMiddleware` (from `middleware.utils`) so callers import from one place.

## Dependencies

| Package | Role |
|---------|------|
| `@simpill/logger.utils` | Structured logging and `setupObservability` implementation |
| `@simpill/middleware.utils` | `createCorrelationMiddleware` and related types |
| `@simpill/request-context.utils` | Declared dependency; provides AsyncLocalStorage request context |

## Key Design Decisions

- **Facade pattern**: this package owns no logic — it only re-exports from specialist packages. This means adding new observability features is done in the respective package, not here.
- **Thin tsconfig**: `lib: ["ES2022"]`, Node types only; no DOM or browser globals.
- If you need request-context utilities directly (e.g. `getRequestContext`, `runWithRequestContext`), import from `@simpill/request-context.utils` rather than relying on this package to re-export them.

Tests in `__tests__/server/unit/*.unit.test.ts`.
