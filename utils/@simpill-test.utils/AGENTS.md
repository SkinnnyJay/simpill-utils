# @simpill/test.utils – Agent guidelines

## Structure

- **src/shared/** – FakerWrapper, enricher, test patterns, vitest/jest helpers; runtime-agnostic test utilities.
- **src/client** and **src/server** – Re-export shared; add runtime-specific test helpers if needed.
- **__tests__/shared/unit/** – Unit tests for faker, enricher, patterns.

## Conventions

- Keep shared code free of test-runner coupling where possible; use adapters for Jest vs Vitest.
- Use strict TypeScript; deterministic seeds for faker.
- File size limit 400 lines; 80%+ test coverage for the utilities themselves.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
