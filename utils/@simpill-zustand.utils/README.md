## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fzustand.utils.svg)](https://www.npmjs.com/package/@simpill/zustand.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-zustand.utils)
</p>

**npm**
```bash
npm install @simpill/zustand.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-zustand.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-zustand.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createTypedStore,
  withPersist,
  withDevtools,
  createSlice,
  combineSlices,
  createMemoSelector,
} from "@simpill/zustand.utils";

// Two-arg form: initial state + actions factory (full inference)
const useCounterStore = createTypedStore(
  { count: 0, name: "" },
  (set) => ({
    increment: () => set((s) => ({ count: s.count + 1 })),
    setName: (name: string) => set({ name }),
  })
);

// Slices with full type inference — no casts, colliding keys throw
const counterSlice = createSlice({ count: 0 }, (set) => ({
  increment: () => set((s) => ({ count: s.count + 1 })),
}));
const nameSlice = createSlice({ name: "" }, (set) => ({
  setName: (name: string) => set({ name }),
}));
import { createStore } from "zustand/vanilla";
const store = createStore(combineSlices(counterSlice, nameSlice).toStateCreator());
store.getState().increment(); // fully typed

// Memoized derived selector (zero-dep, reselect-style)
const selectLabel = createMemoSelector(
  [(s: { count: number; name: string }) => s.count, (s: { count: number; name: string }) => s.name],
  (count, name) => `${name}: ${count}`
);

// One-shot store with persist + devtools (React/frontend)
import { createAppStore, whenHydrated } from "@simpill/zustand.utils";

const useAppStore = createAppStore(
  (set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }),
  { persist: withPersist("app-store", { version: 1 }), devtools: withDevtools("AppStore") }
);
// persist API is typed on the return value:
await whenHydrated(useAppStore);
useAppStore.persist.hasHydrated(); // true
```

### SSR / Next.js

`withPersist`/`withPersistClientOnly` no-op safely on the server (no more
`storage.setItem is not a function` on every set). For hydration-mismatch-free
UI use zustand's documented pattern, now first-class here:

```ts
const useStore = createAppStore(builder, {
  persist: withPersist("prefs", { skipHydration: true }),
});
// client-side, after mount:
useStore.persist.rehydrate();
await whenHydrated(useStore);
```

**Coverage:** This package uses lower coverage thresholds (72% branches, 70% functions) than the repo default 80% due to React/Zustand integration and hard-to-hit branches; lines and statements remain 80%.

## Subpath exports

- `@simpill/zustand.utils` – all exports
- `@simpill/zustand.utils/shared` – store factory, slices, types (vanilla, no React)
- `@simpill/zustand.utils/client` – persist, devtools, `createAppStore`, `withPersistClientOnly`
- `@simpill/zustand.utils/server` – shared + `createInMemoryStorage` (no browser persist/devtools)

## API

- **Store**: `createTypedStore` (vanilla; builder form or initialState+actions form), `createSelector`, `createMemoSelector` (memoized derived selectors), `createAppStore` (React, with optional persist/devtools; persist API typed on the returned store)
- **Persist**: `withPersist`, `withPersistClientOnly` (SSR-safe), `getClientOnlyStorage`, `createInMemoryStorage` (tests/server), `whenHydrated`, versioning + migrate + partialize + merge + onRehydrateStorage + skipHydration
- **Devtools**: `withDevtools`, middleware composition
- **Slices**: `createSlice` (deep-isolated initial state), `combineSlices` (full type inference, scoped set, `SliceCollisionError` on duplicate keys, `toStateCreator()`)

### What we don't provide

- **Zustand replacement** — **zustand** is a required **peer dependency** (moved from `dependencies`: a state library must be a singleton; a second copy silently splits your stores); we add typed factory, persist wrappers, and slice helpers on top.
- **Persist backends** — **withPersist** uses **localStorage** / **sessionStorage** (or custom storage you pass); `createInMemoryStorage` covers tests/server. For Redis persist implement a custom storage adapter.
- **React Query / other state** — Zustand-only; for server state or caching use **@tanstack/react-query**, SWR, or similar.

## License

ISC
