# @simpill/zustand.utils

Zustand store helpers: typed store factory, persist wrappers (versioning + migrate), devtools middleware composition, and slice helpers.

## Install

```bash
npm install @simpill/zustand.utils zustand
```

## Usage

```typescript
import {
  createTypedStore,
  withPersist,
  withDevtools,
  createSlice,
  combineSlices,
} from "@simpill/zustand.utils";

const useCounterStore = createTypedStore(
  { count: 0, name: "" },
  (set) => ({
    increment: () => set((s) => ({ count: s.count + 1 })),
    setName: (name: string) => set({ name }),
  })
);

// One-shot store with persist + devtools (React/frontend)
import { createAppStore, withPersist, withDevtools } from "@simpill/zustand.utils";

const useAppStore = createAppStore(
  (set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }),
  { persist: withPersist("app-store", { version: 1 }), devtools: withDevtools("AppStore") }
);
```

**Coverage:** This package uses lower coverage thresholds (72% branches, 70% functions) than the repo default 80% due to React/Zustand integration and hard-to-hit branches; lines and statements remain 80%.

## Subpath exports

- `@simpill/zustand.utils` – all exports
- `@simpill/zustand.utils/shared` – store factory, slices, types (vanilla, no React)
- `@simpill/zustand.utils/client` – persist, devtools, `createAppStore`, `withPersistClientOnly`
- `@simpill/zustand.utils/server` – shared only (no persist/devtools)

## API

- **Store**: `createTypedStore` (vanilla), `createSelector`, `createAppStore` (React, with optional persist/devtools)
- **Persist**: `withPersist`, `withPersistClientOnly` (SSR-safe), `getClientOnlyStorage`, versioning + migrate
- **Devtools**: `withDevtools`, middleware composition
- **Slices**: `createSlice`, `combineSlices`

### What we don't provide

- **Zustand replacement** — **zustand** is a required peer; we add typed factory, persist wrappers, and slice helpers on top.
- **Persist backends** — **withPersist** uses **localStorage** / **sessionStorage** (or custom storage you pass). For Redis or server persist implement a custom storage adapter.
- **React Query / other state** — Zustand-only; for server state or caching use **@tanstack/react-query**, SWR, or similar.

## License

ISC
