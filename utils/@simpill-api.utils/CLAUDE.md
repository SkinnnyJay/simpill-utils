# CLAUDE.md – @simpill/api.utils

Package for typed API factory (fetch client + handler registry) with Zod validation and middleware.

## Commands

From `utils/api.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/api.utils` – shared types + server (createApiFactory, fetchWithRetry, fetchWithTimeout).
- **Server**: `@simpill/api.utils/server` – full API factory and fetch helpers.
- **Shared**: `@simpill/api.utils/shared` – ApiRouteDef, ApiSchema, ApiHandler, ApiClient, ApiMiddleware, RetryOptions.

## Implementation layout

- `src/shared/types.ts` – ApiRouteDef, ApiSchema, ApiHandler, ApiMiddleware, RetryOptions.
- `src/server/api-factory.ts` – createApiFactory, route builder, client(), handlers().
- `src/server/fetch-helpers.ts` – fetchWithRetry, fetchWithTimeout.

Tests in `__tests__/server/unit/*.unit.test.ts`.
