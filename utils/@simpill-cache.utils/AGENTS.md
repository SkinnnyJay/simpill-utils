# @simpill/cache.utils – Agent guidelines

## Structure

- **src/shared/** – LRUMap, memoize (runtime-agnostic).
- **src/server/** – TTLCache (time-to-live, Node-friendly if needed).
- **src/client** – Re-export shared; add browser-safe code here if needed.
- **__tests__/shared/unit/** – Unit tests for LRUMap and memoize; **__tests__/server/unit/** for TTLCache if present.

## Conventions

- Keep shared code free of Node/fs; cache implementations should be side-effect clear.
- Use strict TypeScript; generic key/value types in shared.
- File size limit 400 lines; 80%+ test coverage.

## Commands

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build
