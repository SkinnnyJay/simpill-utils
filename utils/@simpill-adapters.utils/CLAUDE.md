# CLAUDE.md – @simpill/adapters.utils

Package for createAdapter, LoggerAdapter, consoleLoggerAdapter, CacheAdapter, memoryCacheAdapter.

## Commands

From `utils/adapters.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/adapters.utils` – all exports.
- **Shared**: `@simpill/adapters.utils/shared` – createAdapter, logger/cache adapters.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
