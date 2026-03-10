# CLAUDE.md – @simpill/nextjs.utils

Package for Next.js App Router helpers: safe server actions, route handlers, request context, middleware.

## Commands

From `utils/nextjs.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/nextjs.utils` – all exports.
- **Server**: createSafeAction, parseSearchParams, jsonResponse, errorResponse, withRequestContext, getRequestContext.
- **Client**: withCorrelation (Edge-safe).
- **Shared**: ActionResult, ActionError.

## Implementation layout

- `src/server/create-safe-action.ts` – Zod input validation; returns { data, error }.
- `src/server/route-helpers.ts` – getSearchParamsFromRequest, parseSearchParams, jsonResponse, errorResponse.
- `src/server/with-request-context.ts` – runWithRequestContext wrapper; getHeaders option.
- `src/client/middleware-helpers.ts` – withCorrelation for x-request-id / x-trace-id.
- `src/shared/types.ts` – ActionResult, ActionError.

Tests in `__tests__/server/unit/` and `__tests__/client/unit/`.
