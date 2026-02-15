# CLAUDE.md – @simpill/annotations.utils

Package for createMetadataStore, getMetadata, setMetadata, globalMetadataStore.

## Commands

From `utils/annotations.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/annotations.utils` – all exports.
- **Shared**: `@simpill/annotations.utils/shared` – metadata store and get/set.
- **Client/Server**: re-export shared.

Tests in `__tests__/shared/unit/*.unit.test.ts`.
