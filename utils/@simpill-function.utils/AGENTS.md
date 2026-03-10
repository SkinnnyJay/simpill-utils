# @simpill/function.utils – Agent guidelines

## Structure

- **src/shared/** – debounce, throttle, once, pipe, compose; runtime-agnostic function helpers.
- **src/client** and **src/server** – Re-export shared; add runtime-specific code here if needed.
- **__tests__/shared/unit/** – Unit tests for debounce, throttle, once, pipe, compose.

## Conventions

- Keep helpers pure and side-effect free where possible; document timing (debounce/throttle).
- Use strict TypeScript; generic function types in shared.
- New utilities belong in `shared/` unless they require Node or browser APIs.
- File size limit 400 lines; 80%+ test coverage.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
