# misc.utils

Convenience bundle that re-exports from canonical packages. No local implementations for these utilities; see README "Canonical sources" table.

## Structure

- `src/shared/index.ts` — re-exports from function.utils, async.utils, cache.utils, object.utils, uuid.utils, enum.utils.
- `src/server/index.ts` — re-exports from object.utils (BoundedArray, BoundedLRUMap), time.utils (IntervalManager, timers), async.utils (PollingManager).
- `src/client/index.ts` — re-exports shared only (edge-safe).

## Commands

- `npm run build`, `npm test`, `npm run test:coverage`, `npm run check:fix`, `npm run verify`

## Conventions

- Dependencies: async.utils, cache.utils, enum.utils, function.utils, object.utils, time.utils, uuid.utils.
- Tests in `__tests__/{shared,server}/unit/` assert re-exported behavior; 80% coverage.
