# CLAUDE.md – @simpill/patterns.utils

Package for composable design patterns (Result, Strategy, Chain, Command, State, etc.).

## Commands

From `utils/patterns.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/patterns.utils` – all exports.
- **Shared**: `@simpill/patterns.utils/shared` – pattern utilities.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
