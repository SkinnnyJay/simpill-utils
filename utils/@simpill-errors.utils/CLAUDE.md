# CLAUDE.md – @simpill/errors.utils

Package for typed errors: AppError, ERROR_CODES, createErrorCodeMap, serializeError.

## Commands

From `utils/errors.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/errors.utils` – all exports.
- **Shared**: `@simpill/errors.utils/shared` – AppError, ERROR_CODES, createErrorCodeMap, serializeError.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
