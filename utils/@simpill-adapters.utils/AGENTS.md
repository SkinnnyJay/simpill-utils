# @simpill/adapters.utils – Agent guidelines

## Structure

- **src/shared/** – create-adapter, logger-adapter, cache-adapter; runtime-agnostic.
- **src/client** and **src/server** – Re-export shared.
- **__tests__/shared/unit/** – Unit tests for all public APIs.

## Conventions

- Keep interfaces minimal; 80%+ coverage; file size limit 400 lines.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
