# @simpill/enum.utils – Agent guidelines

## Structure

- **src/shared/** – getEnumValue, isValidEnumValue, EnumHelper; runtime-agnostic.
- **src/client** and **src/server** – Re-export shared.
- **__tests__/shared/unit/** – Unit tests for enum helpers.

## Conventions

- Keep shared code side-effect free; string enums only.
- Use strict TypeScript; 80%+ test coverage.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
