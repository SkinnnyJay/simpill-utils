# CLAUDE.md – @simpill/data.utils

Package for data utilities: validate, prepare, lifecycle, extend, config.

## Commands

From `utils/data.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/data.utils` – all exports.
- **Shared**: `@simpill/data.utils/shared` – ValidationResult, valid/invalid, withDefaults, addCreatedAt, deepDefaults, mergeConfigLayers, etc.
- **Client/Server**: re-export shared.

Implementation: data.validate, data.prepare, data.lifecycle, data.extend, config.utils. Tests in `__tests__/shared/unit/*.unit.test.ts`.
