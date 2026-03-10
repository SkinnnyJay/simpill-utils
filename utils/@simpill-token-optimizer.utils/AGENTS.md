# @simpill/token-optimizer.utils – Agent guidelines

## Structure

- **src/shared/** – Token cleaning, strategies (JSON, CSV, XML, YAML, markdown, etc.), types, validator registry.
- **src/server/** – Token optimizer factory, telemetry factory and storage (Node/fs).
- **src/client/** – Re-export shared; add edge-safe code here if needed.
- **__tests__/** – Unit tests under `__tests__/shared/unit/` and `__tests__/server/unit/`.

## Conventions

- Keep shared code free of Node/fs; server-only code in `server/`.
- Use strict TypeScript; strategy and telemetry types in shared.
- File size limit 400 lines; split by concern (strategies, storage, factory).
- Tests: 80%+ coverage; unit test all public APIs.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
