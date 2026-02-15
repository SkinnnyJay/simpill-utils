# CLAUDE.md – @simpill/react.utils

Package for framework-agnostic React utilities: hooks, safe context, stable callbacks, transitions.

## Commands

From `utils/react.utils`:

- `npm run build` – compile to `dist/`
- `npm test` / `npm run test:coverage` – run tests (jsdom)
- `npm run check:fix` – lint and format
- `npm run verify` – format, lint, typecheck, test, build

## Exports

- **Main**: `@simpill/react.utils` – all exports.
- **Client**: `@simpill/react.utils/client` – hooks, createSafeContext, useSafeContext.
- **Shared**: `@simpill/react.utils/shared` – types (ReactNode, ComponentType, RefObject).
- **Server**: re-export placeholder; reserved for RSC helpers.

## Implementation layout

- `src/client/use-latest.ts` – Ref that holds latest value.
- `src/client/create-safe-context.ts` – createSafeContext, useSafeContext.
- `src/client/use-stable-callback.ts` – Stable callback via useLatest.
- `src/client/use-lazy-state.ts` – Lazy useState initializer.
- `src/client/use-deferred-update.ts` – setState wrapped in startTransition.
- `src/shared/types.ts` – Re-exports of React types.

Tests in `__tests__/client/unit/*.unit.test.ts` and `__tests__/shared/unit/*.unit.test.ts`.
