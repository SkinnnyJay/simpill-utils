# CLAUDE.md – @simpill/cache.utils

Package for LRU and TTL cache utilities with memoize.

## Commands

From `utils/cache.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/cache.utils` – all exports.
- **Shared**: `@simpill/cache.utils/shared` – LRUMap, memoize.
- **Server**: `@simpill/cache.utils/server` – TTLCache.
- **Client**: re-export shared.

Tests in `__tests__/shared/unit/` (and `__tests__/server/unit/` for server if applicable).
