# CLAUDE.md – @simpill/token-optimizer.utils

Package for token optimization: cleaning prompts, compression strategies (JSON, CSV, XML, YAML, markdown), and telemetry.

## Commands

From `utils/token-optimizer.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/token-optimizer.utils` – all exports.
- **Server**: `@simpill/token-optimizer.utils/server` – factory, telemetry storage (Node/fs).
- **Shared**: `@simpill/token-optimizer.utils/shared` – strategies, types, validator registry, tokenizer, cleaner.
- **Client**: re-export shared; use for edge-safe imports.

## Implementation layout

- `src/shared/` – strategies (base, json, csv, xml, yaml, markdown, toon, tonl, passthrough), tokenizer, cleaner, types, analytics stubs.
- `src/server/` – tokenOptimizerFactory, telemetryFactory, telemetryStorage, fs stubs.
- Tests in `__tests__/shared/unit/` and `__tests__/server/unit/`.
