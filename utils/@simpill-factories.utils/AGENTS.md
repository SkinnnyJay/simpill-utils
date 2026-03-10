# @simpill/factories.utils – Agent guidelines

## Structure

- **src/shared/** – create-factory, singleton-factory, error-factory; runtime-agnostic.
- **src/client** and **src/server** – Re-export shared.
- **__tests__/shared/unit/** – Unit tests for all public APIs.

## Conventions

- Keep helpers pure; 80%+ coverage; file size limit 400 lines.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
