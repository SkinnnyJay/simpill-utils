# CLAUDE.md – @simpill/uuid.utils

Package for UUID helpers: generateUUID, validateUUID, isUUID, compareUUIDs, UUIDHelper.

## Commands

From `utils/uuid.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/uuid.utils` – all exports.
- **Shared**: `@simpill/uuid.utils/shared` – generateUUID, validateUUID, isUUID, compareUUIDs, UUIDHelper.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
