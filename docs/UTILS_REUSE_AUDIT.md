# Utils Reuse Audit — Recommendations

**Scope:** `@simpill` packages under `utils/`. Recommendations only; no code changes in this document.

**Aligns with:** [ADR-0001: Utils protocols and canonical ownership](adr/0001-utils-protocols-and-canonical-ownership.md) for debounce/throttle and LRU/cache.

---

## Executive summary

Across `utils/` there are **duplicate implementations** of debounce/throttle, interval/polling managers, LRU and bounded structures, UUID, raceWithTimeout, singleton, once, memoize, and enum helpers. This audit recommends a **canonical home** for each, a **re-export strategy** for non-canonical packages, and a **phased migration order** to simplify the codebase and steer consumers to a single package per concern.

| Concern | Canonical package | Re-export or remove from |
|--------|-------------------|---------------------------|
| debounce / throttle | `@simpill/function.utils` | time.utils, misc.utils |
| interval manager | `@simpill/time.utils` | misc.utils |
| polling manager | `@simpill/async.utils` | misc.utils |
| LRU map (simple) | `@simpill/cache.utils` | — |
| BoundedLRUMap / BoundedArray | `@simpill/object.utils` | misc.utils |
| LRUCache (collection) | `@simpill/collections.utils` | — |
| UUID | `@simpill/uuid.utils` | misc.utils |
| raceWithTimeout | `@simpill/async.utils` | misc.utils |
| singleton | `@simpill/object.utils` | misc.utils |
| once | `@simpill/function.utils` | misc.utils |
| memoize | `@simpill/cache.utils` | misc.utils |
| enum helpers | `@simpill/enum.utils` | misc.utils |

**Suggested migration order:** (1) UUID and enum helpers, (2) raceWithTimeout and once, (3) debounce/throttle and memoize, (4) singleton and bounded structures, (5) interval and polling managers. Risks and test touchpoints are noted per phase.

---

## 1. Package export surfaces (summary)

- **socket.utils** — Exports `createReconnectingWebSocket`, reconnect/heartbeat options. Depends on `@simpill/async.utils` (e.g. delay). Subpaths: `.`, `./client`, `./server`, `./shared`.
- **async.utils** — Exports delay, retry, raceWithTimeout, PollingManager, concurrency (Semaphore, Mutex, withLimit), series/mapAsync/timeouts, createQueue. Subpaths: `.`, `./client`, `./server`, `./shared`.
- **adapters.utils** — Exports createAdapter, CacheAdapter, LoggerAdapter, memoryCacheAdapter, consoleLoggerAdapter. No internal duplication; use for unified logger/cache adapter typing.
- **function.utils** — Exports debounce, throttle, once, pipe/compose, annotations, arguments helpers. Canonical for debounce/throttle/once per ADR-0001 and this audit.
- **time.utils** — Exports date/time helpers, debounce/throttle (duplicate), IntervalManager (server). Canonical for intervals/timers; should re-export debounce/throttle from function.utils.
- **misc.utils** — Exports many overlapping utilities (singleton, debounce, throttle, once, memoize, raceWithTimeout, enums, UUID, BoundedArray, BoundedLRUMap, IntervalManager, PollingManager). Intended as a “backend misc” bucket; after consolidation it should re-export from canonical packages and optionally deprecate its own implementations.
- **cache.utils** — Exports LRUMap, InMemoryCache, memoize, memoizeAsync. Canonical for simple LRU and memoize.
- **object.utils** — Exports BoundedLRUMap, BoundedArray, get/set, merge, guards, singleton, etc. Canonical for bounded structures and singleton (object-lifecycle oriented).
- **collections.utils** — Exports LRUCache, TTLCache, Queue, Stack, LinkedList, etc. Canonical for collection-style LRU and TTL.
- **uuid.utils** — Exports generateUUID (v1/v4/v5), validateUUID, isUUID, compareUUIDs, parseUUID, UUIDHelper. Canonical for UUID.
- **enum.utils** — Exports getEnumValue, isValidEnumValue, EnumHelper. Canonical for enum helpers.

---

## 2. Duplicate inventory and recommendations

### 2.1 Debounce / throttle

| Location | File |
|----------|------|
| function.utils | `src/shared/debounce-throttle.ts` |
| time.utils | `src/shared/debounce-throttle.ts` |
| misc.utils | `src/shared/debounce-throttle.ts` |

**Recommendation:** Keep **function.utils** as the single implementation (per ADR-0001). **time.utils** and **misc.utils** should re-export from `@simpill/function.utils` and deprecate local implementations (or remove and document migration in README).

---

### 2.2 Interval manager

| Location | File |
|----------|------|
| time.utils | `src/server/interval-manager.ts` |
| misc.utils | `src/server/interval-manager.ts` |

**Recommendation:** Keep **time.utils** as canonical (time/timer focus). **misc.utils** should re-export from `@simpill/time.utils/server` and remove its own implementation.

---

### 2.3 Polling manager

| Location | File |
|----------|------|
| async.utils | `src/shared/polling-manager.ts` |
| misc.utils | `src/server/polling-manager.ts` |

**Recommendation:** Keep **async.utils** as canonical (async/polling focus; already has zod-validated options and shared export). **misc.utils** should re-export from `@simpill/async.utils` and remove its own implementation.

---

### 2.4 LRU and bounded structures

| Implementation | Package | File(s) |
|----------------|----------|---------|
| LRUMap | cache.utils | `src/shared/lru-map.ts` |
| LRUCache | collections.utils | `src/shared/collections/lru-cache.ts` (and collections index) |
| BoundedLRUMap | object.utils | `src/shared/bounded-lru-map.ts` |
| BoundedLRUMap | misc.utils | `src/server/bounded-lru-map.ts` |
| BoundedArray | object.utils | `src/shared/bounded-array.ts` |
| BoundedArray | misc.utils | `src/server/bounded-array.ts` |

**Recommendation:** Per ADR-0001, **cache.utils** is canonical for simple LRU map; **collections.utils** for collection-style LRUCache/TTLCache. **object.utils** is canonical for **BoundedLRUMap** and **BoundedArray** (bounded structures with optional logger/stats). **misc.utils** should re-export BoundedLRUMap and BoundedArray from `@simpill/object.utils` and remove its own server implementations.

---

### 2.5 UUID

| Location | File |
|----------|------|
| uuid.utils | `src/shared/uuid.utils.ts` (uuid lib; v1/v4/v5, parse, compare) |
| misc.utils | `src/shared/uuid.ts` (manual v4-style) |

**Recommendation:** **uuid.utils** is canonical. **misc.utils** should re-export from `@simpill/uuid.utils` and remove its own implementation to avoid two UUID APIs.

---

### 2.6 raceWithTimeout

| Location | File |
|----------|------|
| async.utils | `src/shared/race-with-timeout.ts` |
| misc.utils | `src/shared/race-with-timeout.ts` |

**Recommendation:** **async.utils** is canonical. **misc.utils** should re-export from `@simpill/async.utils` and remove its own implementation. (http.utils already uses `@simpill/async.utils`.)

---

### 2.7 Singleton

| Location | File |
|----------|------|
| object.utils | `src/shared/singleton.ts` |
| misc.utils | `src/shared/singleton.ts` |

**Recommendation:** **object.utils** as canonical (object lifecycle / factory pattern). **misc.utils** should re-export from `@simpill/object.utils` and remove its own implementation.

---

### 2.8 once

| Location | File |
|----------|------|
| function.utils | `src/shared/once.ts` |
| misc.utils | `src/shared/once.ts` |

**Recommendation:** **function.utils** is canonical. **misc.utils** should re-export from `@simpill/function.utils` and remove its own implementation.

---

### 2.9 Memoize

| Location | File |
|----------|------|
| cache.utils | `src/shared/memoize.ts` |
| misc.utils | `src/shared/memoize.ts` |

**Recommendation:** **cache.utils** is canonical. **misc.utils** should re-export from `@simpill/cache.utils` and remove its own implementation.

---

### 2.10 Enum helpers

| Location | File |
|----------|------|
| enum.utils | `src/shared/enum.utils.ts` (EnumHelper, getEnumValue, isValidEnumValue) |
| misc.utils | `src/shared/enums.ts` (getEnumValue, isValidEnumValue) |

**Recommendation:** **enum.utils** is canonical. **misc.utils** should re-export from `@simpill/enum.utils` and remove its own implementation.

---

## 3. Re-export strategy

- **Non-canonical packages** (here: mainly **time.utils** and **misc.utils**):
  - Add a dependency on the canonical package where needed (e.g. misc.utils depends on async.utils, function.utils, object.utils, cache.utils, uuid.utils, enum.utils, time.utils).
  - In the appropriate entry (e.g. `shared/index.ts` or `server/index.ts`), re-export the canonical symbol(s) and document in README that the implementation lives in the other package.
  - Optionally deprecate in JSDoc: `@deprecated Prefer importing from @simpill/<canonical>.utils`.
- **Avoid** keeping two implementations in the tree; prefer “re-export only” so behavior and fixes live in one place.
- **misc.utils** after consolidation: can remain a “convenience” bundle that re-exports from multiple canonicals, with README and AGENTS.md updated to list canonical sources for each export.

---

## 4. Consolidation roadmap (phased)

| Phase | Scope | Risk | Test touchpoints |
|-------|--------|------|-------------------|
| **1** | UUID and enum helpers: misc.utils → re-export from uuid.utils and enum.utils, remove local impls | Low; APIs align | misc.utils unit tests for uuid and enums; switch to re-exports and re-run |
| **2** | raceWithTimeout and once: misc.utils → re-export from async.utils and function.utils, remove local impls | Low | misc.utils unit tests for raceWithTimeout and once |
| **3** | debounce/throttle and memoize: time.utils and misc.utils → re-export from function.utils and cache.utils, remove local impls | Medium; many call sites possible | All packages that import debounce/throttle/memoize from time.utils or misc.utils; run full utils test suite |
| **4** | singleton and bounded structures: misc.utils → re-export from object.utils, remove BoundedArray/BoundedLRUMap/singleton impls | Medium | misc.utils server and shared tests; any consumer of misc Bounded* or singleton |
| **5** | Interval and polling: misc.utils → re-export from time.utils and async.utils, remove interval-manager and polling-manager | Medium | misc.utils server tests; packages that use misc IntervalManager or PollingManager |

Execute in order; after each phase run `npm test` (and where applicable `npm run verify`) in affected packages and in any consuming packages (e.g. socket.utils, http.utils).

---

## 5. Risks and test touchpoints (if implementing)

- **API surface differences:** Before removing an implementation, compare function signatures and options (e.g. PollingManager options, BoundedLRUMap options) between canonical and misc/time. Align or document small adapters.
- **Import paths:** Consumers using `@simpill/misc.utils/server` for BoundedLRUMap or PollingManager must get the same types and behavior after re-export; verify with typecheck and tests.
- **Test coverage:** Each canonical package already has unit tests for its implementation. After re-export, misc.utils tests for removed code can be removed or replaced with shallow “re-export exists” tests.
- **Documentation:** Update README, AGENTS.md, and CLAUDE.md in misc.utils and time.utils to point to canonical packages and to document the re-export strategy.

---

## 6. Where to use which package (quick reference)

- **Async flows (delay, retry, timeout, polling, queue, concurrency):** `@simpill/async.utils`
- **Rate limiting (debounce, throttle) and once/pipe/compose:** `@simpill/function.utils`
- **Time and intervals (dates, interval manager, managed timeout):** `@simpill/time.utils`
- **Simple LRU / TTL cache and memoize:** `@simpill/cache.utils`
- **Bounded structures (BoundedLRUMap, BoundedArray) and singleton:** `@simpill/object.utils`
- **Collection data structures (LRUCache, TTLCache, Queue, Stack, etc.):** `@simpill/collections.utils`
- **UUID:** `@simpill/uuid.utils`
- **Enum helpers:** `@simpill/enum.utils`
- **Logger/cache adapter interfaces and helpers:** `@simpill/adapters.utils`
- **Reconnecting WebSocket:** `@simpill/socket.utils` (uses async.utils)

This audit is recommendations-only; implementation can follow the roadmap above and ADR-0001.
