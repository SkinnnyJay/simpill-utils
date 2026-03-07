## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fmisc.utils.svg)](https://www.npmjs.com/package/@simpill/misc.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-misc.utils)
</p>

**npm**
```bash
npm install @simpill/misc.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-misc.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-misc.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createSingleton,
  debounce,
  throttle,
  once,
  memoize,
  raceWithTimeout,
} from "@simpill/misc.utils";

const getDb = createSingleton(() => ({ connected: true }), "db");
const load = once(() => fetchConfig());
const double = memoize((x: number) => x * 2);
```

---

## Canonical sources (re-export strategy)

This package re-exports from canonical packages. Prefer importing from the canonical package when you need only that utility.

| Export | Canonical package |
|--------|-------------------|
| debounce, throttle, once | `@simpill/function.utils` |
| raceWithTimeout | `@simpill/async.utils` |
| memoize, MemoizeCache | `@simpill/cache.utils` |
| createSingleton, resetSingleton, resetAllSingletons | `@simpill/object.utils` |
| generateUUID, validateUUID, isUUID, compareUUIDs | `@simpill/uuid.utils` |
| getEnumValue, isValidEnumValue, EnumHelper | `@simpill/enum.utils` |
| BoundedArray, BoundedLRUMap | `@simpill/object.utils` (server) |
| IntervalManager, createManagedInterval, createManagedTimeout, createTimerFactory | `@simpill/time.utils` (server) |
| PollingManager | `@simpill/async.utils` |
| assert, coalesce, identity, isBoolean, parseJsonSafe, toBoolean, toJsonSafe, toggle | local (misc.utils) |

## Features

| Feature | Description |
|---------|-------------|
| **createSingleton** | Keyed lazy singleton (from object.utils) |
| **debounce** / **throttle** / **once** | Rate limiting and once (from function.utils). Options (leading, trailing, maxWait) and cancel/flush are documented there. |
| **memoize** | Cache by key (from cache.utils) |
| **raceWithTimeout** | Promise with timeout (from async.utils) |
| **getEnumValue** / **isValidEnumValue** / **EnumHelper** | Enum helpers (from enum.utils) |
| **generateUUID** / **validateUUID** / **isUUID** / **compareUUIDs** | UUID helpers (from uuid.utils) |
| **BoundedArray** / **BoundedLRUMap** | Server-only bounded structures (from object.utils) |
| **IntervalManager** / **PollingManager** | Server-only timers and polling (from time.utils, async.utils) |
| **assert** / **coalesce** / **toBoolean** / **parseJsonSafe** | Local primitive helpers |

---

## Import Paths

```ts
import { ... } from "@simpill/misc.utils";         // Everything
import { ... } from "@simpill/misc.utils/client";  // Client
import { ... } from "@simpill/misc.utils/server";  // Server (BoundedArray, LRU, IntervalManager, PollingManager)
import { ... } from "@simpill/misc.utils/shared";  // Shared only
```

---

## API Reference

- **createSingleton**, **resetSingleton**, **resetAllSingletons**
- **debounce**, **throttle** — CancellableFunction (re-exports from function.utils). For **leading**, **trailing**, **maxWait**, **cancel**, **flush**, see `@simpill/function.utils`; these are the same APIs.
- **once**, **memoize**, **raceWithTimeout**
- **getEnumValue**, **isValidEnumValue**
- **generateUUID**, **validateUUID**, **isUUID**, **compareUUIDs**
- **assert**, **coalesce**, **identity**, **isBoolean**, **parseJsonSafe**, **toBoolean**, **toJsonSafe**, **toggle**
- **BoundedArray**, **BoundedLRUMap** (server)
- **IntervalManager**, **createManagedInterval**, **createManagedTimeout**, **createTimerFactory** (server)
- **PollingManager** (server)

### Guidance vs lodash / uuid / LRU

This package re-exports **@simpill** utilities. For **lodash**: use lodash when you need a large set of string/array/object helpers (e.g. `_.get`, `_.groupBy`); misc.utils and object.utils provide a small subset (coalesce, getByPath, etc.). For **UUID**: use **@simpill/uuid.utils** (or misc re-exports) for generate/validate/compare; the canonical package supports v1/v4/v5. For **LRU**: **BoundedLRUMap** (object.utils, server) is a bounded LRU; for TTL or Redis-backed LRU use **@simpill/cache.utils** or a dedicated cache library.

### Retry and backoff

**misc.utils** does **not** provide retry or backoff. Use **@simpill/async.utils** **retry** (maxAttempts, delayMs, backoffMultiplier, onRetry) for retrying async work. Use **@simpill/resilience.utils** **withJitter**(delayMs, { factor, maxMs }) to jitter delays and pass the result as **delayMs** to retry. For circuit breakers and rate limiters see resilience.utils.

### AbortController patterns

**misc.utils** does **not** add AbortController support. Use **AbortController** and **signal** where the underlying API supports it: **@simpill/async.utils** Semaphore/Gate **run**(fn, { signal }), **@simpill/http.utils** fetchWithTimeout/fetchWithRetry with **init.signal**, and **raceWithTimeout** (which uses a timeout timer, not signal). Pass the same **signal** through your stack for request cancellation.

### Memoize cache strategy

**memoize** is re-exported from **@simpill/cache.utils**. Cache strategy (key function, TTL, max size) is configured there; see cache.utils README for **memoize** and **memoizeAsync** options. By default memoize uses an in-memory cache keyed by arguments; for custom key or cache instance use the canonical package.

### UUID version semantics

**generateUUID** (and **validateUUID**, **isUUID**, **compareUUIDs**) are from **@simpill/uuid.utils**. Version semantics (v1 time-based, v4 random, v5 namespace+name) and which version is generated by **generateUUID** are documented in uuid.utils. Use the canonical package for version-specific APIs (e.g. v5 with custom namespace).

### Polling and interval examples

**PollingManager** is re-exported from **@simpill/async.utils** (server). Use it to run a callback on an interval with start/stop; see async.utils README for options and usage. **IntervalManager**, **createManagedInterval**, **createManagedTimeout** are from **@simpill/time.utils** (server) for managed timers with cleanup. Example: `const pm = new PollingManager({ intervalMs: 5000, run: async () => { await doWork(); } }); pm.start();` then `pm.stop()` when done.

### Error handling for polling

**PollingManager** runs your **run** callback on each tick. If **run** throws, the error is not swallowed by default but behavior depends on the implementation (e.g. may stop the poll or emit). Handle errors inside **run** (try/catch and log or report) so one failed tick doesn’t break the loop. For retry-on-failure use **@simpill/async.utils** **retry** inside **run** or wrap the call in **fromPromise** (patterns.utils) for Result-shaped handling.

### What we don't provide

- **Retry / backoff** — Use **@simpill/async.utils** **retry** and **@simpill/resilience.utils** **withJitter** for retries and jitter.
- **AbortController / AbortSignal** — No built-in support; use **signal** where the underlying API accepts it (async.utils, http.utils, etc.).
- **Utilities not in the re-export table** — This package only re-exports from canonical @simpill packages and a few local helpers; for anything else use the canonical package or another library.

### When to use

| Use case | Recommendation |
|----------|----------------|
| One-stop re-exports for backend scripts | Use **@simpill/misc.utils** (client/server by entry). |
| Only debounce/throttle/once | Use **@simpill/function.utils**. |
| Only retry/timeout/async | Use **@simpill/async.utils** and **@simpill/resilience.utils** for jitter. |
| Only UUID | Use **@simpill/uuid.utils**. |
| Only memoize/cache | Use **@simpill/cache.utils**. |
| Cancellation (AbortSignal) | Pass **signal** to async.utils Gate, http.utils fetch, or your own loops. |

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createSingleton, once, memoize, debounce, throttle |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
