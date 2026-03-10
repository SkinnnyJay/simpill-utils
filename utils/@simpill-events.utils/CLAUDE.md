# CLAUDE.md – @simpill/events.utils

Package for PubSub, observer, and typed event emitter.

## Commands

From `utils/events.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/events.utils` – all exports.
- **Shared**: `@simpill/events.utils/shared` – PubSub, Observable, EventEmitter.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
