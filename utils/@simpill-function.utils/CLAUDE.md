# CLAUDE.md – @simpill/function.utils

Package for function utilities: debounce, throttle, once, pipe, compose.

## Commands

From `utils/function.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/function.utils` – all exports.
- **Shared**: `@simpill/function.utils/shared` – debounce, throttle, once, pipe, compose.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
