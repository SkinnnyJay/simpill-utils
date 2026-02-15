# CLAUDE.md – @simpill/time.utils

Package for time utilities: date/time helpers (canonical), interval manager (canonical), debounce/throttle (re-exported from `@simpill/function.utils`).

## Commands

From `utils/time.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/time.utils` – all exports.
- **Shared**: `@simpill/time.utils/shared` – date-time, debounce, throttle (debounce/throttle from function.utils).
- **Server**: `@simpill/time.utils/server` – intervalManager, createManagedInterval, createManagedTimeout, IntervalManager.
- **Client**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
