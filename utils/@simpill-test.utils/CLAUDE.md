# CLAUDE.md – @simpill/test.utils

Package for test patterns, faker wrapper, enricher, and runner-agnostic helpers (Jest/Vitest).

## Commands

From `utils/test.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/test.utils` – all exports.
- **Shared**: `@simpill/test.utils/shared` – createFaker, enricher, test patterns, random, constants.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
