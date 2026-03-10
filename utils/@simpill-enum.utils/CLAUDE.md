# CLAUDE.md – @simpill/enum.utils

Package for enum helpers: getEnumValue, isValidEnumValue, EnumHelper.

## Commands

From `utils/enum.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/enum.utils` – all exports.
- **Shared**: `@simpill/enum.utils/shared` – getEnumValue, isValidEnumValue, EnumHelper.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
