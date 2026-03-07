# Monorepo tests

Vitest runs unit, integration, and e2e tests for the @simpill monorepo.

## Prerequisites

- Run `npm install` at repo root so all `@simpill/*` packages and devDependencies (vitest, vite, typescript, tsx, std-env) are installed.
- **To run root build, test.ts (smoke), and Vitest against built packages:** root normally installs packages from GitHub (which may not include built `dist/`). To use your local utils instead:
  1. `npm run utils:prepare` — build all utils packages (install, audit, typecheck, test, build).
  2. `npm run use:local` — point root at `file:./utils/@simpill-*.utils` and run `npm install`.
  3. Then `npm run build`, `npm run test:smoke`, and `npm test` use the local built packages.
- To restore root to GitHub deps: `npm run sync:deps`, then `npm install`.

## Commands

From repo root:

- `npm test` — run all tests
- `npm run test:unit` — `__tests__/unit` only
- `npm run test:integration` — `__tests__/integration` only
- `npm run test:e2e` — `__tests__/e2e` only

## Layout

- **unit** — per-package resolution and behavior: `__tests__/unit/@simpill/<package>/`.
- **unit/_resolver** — dynamic resolution of packages that do not have a dedicated unit test file.
- **integration** — cross-package flows (e.g. env + async, errors + uuid, object + array).
- **e2e** — critical path: core packages resolve and work together (env, uuid, object, array, errors, time).

## Config

`vitest.config.ts` at repo root: Node environment, globals, `__tests__/**/*.test.ts`.
