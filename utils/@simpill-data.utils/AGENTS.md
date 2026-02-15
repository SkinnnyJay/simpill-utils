# @simpill/data.utils – Agent guidelines

## Structure

- **src/shared/** – data.validate, data.prepare, data.lifecycle, data.extend, config.utils; runtime-agnostic helpers.
- **src/client** and **src/server** – Re-export shared; add runtime-specific code here if needed.
- **__tests__/shared/unit/** – Unit tests for validate, prepare, lifecycle, extend, config.

## Conventions

- Keep helpers pure and side-effect free where possible; document mutation or env usage.
- Use strict TypeScript; validation and config types in shared.
- New utilities belong in `shared/` unless they require Node or browser APIs.
- File size limit 400 lines; 80%+ test coverage.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
