# @simpill/async.utils – Agent guidelines

## Structure

- **src/shared/** – raceWithTimeout, retry, delay, PollingManager; runtime-agnostic async helpers.
- **src/client** and **src/server** – Re-export shared; add runtime-specific code here if needed.
- **__tests__/shared/unit/** – Unit tests for shared modules.

## Conventions

- Keep helpers pure and side-effect free where possible; document timing/retry behavior.
- Use strict TypeScript; promise and timeout types in shared.
- New utilities belong in `shared/` unless they require Node or browser APIs.
- File size limit 400 lines; 80%+ test coverage.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
