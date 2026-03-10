# CLAUDE.md – @simpill/async.utils

Package for async utilities: raceWithTimeout, retry, delay, PollingManager.

## Commands

From `utils/async.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/async.utils` – all exports.
- **Shared**: `@simpill/async.utils/shared` – raceWithTimeout, retry, delay, PollingManager.
- **Client/Server**: re-export shared; use when you want explicit runtime entry.

Tests live in `__tests__/shared/unit/*.unit.test.ts`.
