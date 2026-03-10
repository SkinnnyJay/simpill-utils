# @simpill/zustand.utils

Zustand helpers: typed store factory, persist (versioning + migrate), devtools middleware, slice composition.

**Commands**: `npm run build`, `npm test`, `npm run test:coverage`, `npm run check:fix`, `npm run verify`.

**Exports**: Main barrel and subpaths `./shared`, `./client`, `./server`. Shared = factory + slices; client = persist + devtools; server = optional in-memory persist.

**Testing**: Jest, 80% coverage. Tests in `__tests__/shared/unit/` and `__tests__/client/unit/`.
