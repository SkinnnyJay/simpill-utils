# @simpill/nextjs.utils – Agent guidelines

## Structure

- **src/server/** – createSafeAction, route helpers (parseSearchParams, jsonResponse, errorResponse), withRequestContext. Uses Node/Next server APIs; composes with zod.utils, errors.utils, request-context.utils.
- **src/client/** – Edge-safe middleware helpers (withCorrelation). No Node APIs; no next/server in this path so it can run in Edge and tests without next.
- **src/shared/** – Types (ActionResult, ActionError); no Next or Node dependencies.
- **__tests__/server/unit/** and **__tests__/client/unit/** – Unit tests with mocked NextRequest/NextResponse, headers(), runWithRequestContext.

## Conventions

- Server code may use Node-only packages; client and shared must stay Edge-safe (no fs, no Node-only request-context impl).
- Use zod.utils for validation (safeParseResult, flattenZodError); errors.utils for serializeError.
- Keep createSafeAction minimal (no next-safe-action peer); full control over error shape.
- File size limit 400 lines.

## Testing

- Mock NextRequest/NextResponse, headers(), cookies(), runWithRequestContext; no real Next server.
- 80%+ coverage; branch coverage for validation and error paths.
