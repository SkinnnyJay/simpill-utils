# CLAUDE.md – @simpill/object.utils

Package for object-related TypeScript patterns and helpers.

## Commands

From `utils/object.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/object.utils` – all exports.
- **Shared**: `@simpill/object.utils/shared` – types + runtime helpers (guards, get/set, pick/omit, merge, immutable, create).
- **Client/Server**: re-export shared; use when you want explicit runtime entry.

## Implementation layout

- `src/shared/types.ts` – type-only utilities (PartialBy, DeepPartial, etc.).
- `src/shared/guards.ts` – isPlainObject, isRecord, isEmptyObject, isNil, isDefined.
- `src/shared/get-set.ts` – getByPath, getByPathOrDefault, hasPath, setByPath.
- `src/shared/pick-omit.ts` – pick, omit, pickOne.
- `src/shared/merge.ts` – shallowMerge, deepMerge (with options).
- `src/shared/immutable.ts` – deepFreeze, deepSeal.
- `src/shared/create.ts` – createWithDefaults, defineReadOnly, fromEntries.

Tests live in `__tests__/shared/unit/*.unit.test.ts`.
