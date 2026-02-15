# @simpill/api.utils – Agent guidelines

## Structure

- **src/shared/** – Types (ApiRouteDef, ApiSchema, ApiHandler, ApiMiddleware, RetryOptions); no Zod in shared types (import from zod in server).
- **src/server/** – createApiFactory (builder, client, handlers), fetchWithRetry, fetchWithTimeout.
- **src/client/** – Minimal stub; main API is server-only.
- **__tests__/server/unit/** – Unit tests for factory, validation, middleware, retry/timeout.

## Conventions

- Use Zod for params/query/body/response; keep schema optional per route.
- Builder: route(path) → .get/.post/.put/.delete(schema) returning chain; max 400 lines per file.
- Middleware order: before → handler → after; onError when handler or middleware throws.
