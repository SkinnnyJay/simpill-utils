# CLAUDE.md – @simpill/factories.utils

Package for createFactory, singletonFactory, errorFactory.

## Commands

From `utils/factories.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/factories.utils` – all exports.
- **Shared**: `@simpill/factories.utils/shared` – createFactory, singletonFactory, errorFactory, resetSingletonFactory.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
