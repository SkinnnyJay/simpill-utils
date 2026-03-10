# @simpill/events.utils – Agent guidelines

## Structure

- **src/shared/** – PubSub, Observable, EventEmitter; runtime-agnostic event utilities.
- **src/client** and **src/server** – Re-export shared; add runtime-specific code here if needed.
- **__tests__/shared/unit/** – Unit tests for PubSub, observer, event emitter.

## Conventions

- Keep shared code free of Node/browser-specific APIs; event types in shared.
- Use strict TypeScript; typed event maps for EventEmitter.
- File size limit 400 lines; 80%+ test coverage.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
