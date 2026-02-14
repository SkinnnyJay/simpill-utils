# Codebase Scan: 100 Tasks

Deep scan of the `@simpill` monorepo for issues, inconsistencies, anti-patterns, AI slop, feature gaps, bugs, memory leaks, and latency concerns. The repo’s goal: **lightweight, type-safe TypeScript utility packages** with strict structure, 400-line file limit, 80% coverage, and minimal dependencies.

**Scope:** All packages under `utils/` (src, tests, examples). Tasks are ordered by category; severity is implicit (Critical/High/Medium/Low) where applicable.

---

## 1. Architecture & file size (1–10)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 1 | socket.utils `create-reconnecting-websocket.ts` | File is 362 lines; near 400-line limit | Split into: connection loop, heartbeat, options types, and a thin facade to avoid future bloat. |
| 2 | time.utils `interval-manager.ts` | File is 351 lines | Extract managed-interval types and helpers (e.g. `clearAll`) to a separate module. |
| 3 | logger.utils `factory.ts` | Global mutable state (globalAdapter, globalConfig, isMockEnabled, isEnvConfigApplied) | Consider DI or explicit factory options so tests don’t rely on module state. |
| 4 | api.utils `api-factory.ts` | Single large closure (routes, client, handlers) | Split: route registry, client builder, handler builder, and a small `createApiFactory` that composes them. |
| 5 | logger.utils `shared/index.ts` | Barrel re-exports 29+ items | Prefer subpath exports by concern (e.g. formatters, adapters, types) to aid tree-shaking. |
| 6 | token-optimizer.utils `strategies/` | Mixed naming: markdownStrategy.ts vs toonStrategy.ts vs tonlStrategy.ts | Standardize: either all `*-strategy.ts` or all `*Strategy.ts`. |
| 7 | nextjs.utils `server/` | Many single-function files (route-helpers, logging-adapter, annotations-adapter) | Optionally group into route.ts, logging.ts, annotations.ts for discoverability. |
| 8 | patterns.utils | Many small pattern files (adapter, facade, proxy, etc.) | Consider fewer, more cohesive modules if the count becomes hard to maintain. |
| 9 | file.utils `file.utils.ts` | Multiple overloads of readFileAsync in one file | Acceptable; document or split read vs write if it grows. |
| 10 | data.utils vs object.utils | data.extend re-exports getByPath/setByPath; overlap with object.utils | Already consolidated; ensure README clearly states “use object.utils for path; data.utils for deepDefaults/config”. |

---

## 2. TypeScript & type safety (11–25)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 11 | object.utils `get-set.ts` | getByPath returns `unknown`; getByPathOrDefault returns `unknown \| D` | Add overload or generic so callers can get typed results when they narrow. |
| 12 | api.utils `api-factory.ts` | Schema casts `as z.ZodType<...>` in buildHandlerContext and client | RouteEntry.schema could be typed with generics so fewer casts are needed. |
| 13 | api.utils `types.ts` | Heavy use of `unknown` in handler/middleware types | Document “type at call site from schema” and/or add generic ApiHandler<TParams, TQuery, TBody, TResponse>. |
| 14 | file.utils `file.utils.ts` | readFileJson: `return JSON.parse(raw) as T` | Document that T is not runtime-validated; consider optional Zod/validator. |
| 15 | logger.utils adapters/formatters | Remaining `any` or loose casts in file.adapter, pino.adapter | Use LogEntry/LogMetadata and typed streams. |
| 16 | cache.utils `redis-cache.ts` | get() returns `JSON.parse(raw) as V` | Already documented; ensure README warns “validate at use site”. |
| 17 | function.utils `pipe-compose.ts` | pipe/compose return `(x: unknown): unknown` | Use generics to preserve input/output types through the pipeline. |
| 18 | events.utils `events.utils.ts` | handler(p as M[K]), asMapKey cast | Inherent to typed event map; document that payload is trusted per event key. |
| 19 | data.utils `data.extend.ts` | deepDefaults boundary casts (as Record, as T) | Already commented; consider a single type helper for “generic T to Record” at boundary. |
| 20 | errors.utils `serialize-error.ts` | Casts when serializing errors | Use type guards for Error vs plain object to avoid unsafe casts. |
| 21 | enum.utils `enum.utils.ts` | Casts for enum value access | Enum helpers could use generics to reduce casts. |
| 22 | test.utils `faker-wrapper.ts`, `enricher.ts` | any or casts in options/enricher | Type faker options and enricher with generics. |
| 23 | annotations.utils `metadata-store.ts` | get returns `map.get(key) as T \| undefined` | Unavoidable for type-safe get; document. |
| 24 | adapters.utils `logger-adapter.ts` | Heavy unknown in adapter interface | Define a LogPayload or StructuredLog type. |
| 25 | Various test files | Tests use `as` and `any` for mocks | Prefer typed fixtures and typed mocks; reduce over time. |

---

## 3. AI slop & comments (26–35)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 26 | env.utils (env-manager, env-class) | JSDoc restates “Log informational messages” for each method | Remove or shorten to “when to use” only. |
| 27 | env.utils | Section comments “Standard getters”, “Required getters” | Replace with types or file split; avoid filler headers. |
| 28 | env.utils | Long bullet list for one option (e.g. dynamic) | Shorten to one paragraph; link to examples. |
| 29 | logger.utils | @file @description in factory/context/constants | Remove where redundant in a modular codebase. |
| 30 | object.utils `get-set.ts` | JSDoc that restates signature | Keep only edge cases (e.g. empty path, missing segment). |
| 31 | file.utils | Every function has @param path, @returns Promise of… | Keep only constraints (encoding, sync vs async). |
| 32 | nextjs.utils `route-helpers.ts` | One-line JSDoc per export that restates name | Add “why” or remove. |
| 33 | patterns.utils (result, strategy-selector) | Dense JSDoc for each helper | Already trimmed in result.ts; apply same to other pattern modules. |
| 34 | async.utils `concurrency.utils.ts` | Any remaining step-by-step comments | Replace with clear function/variable names. |
| 35 | Example files (env, logger, async) | Long comment blocks in examples | Move prose to README; keep examples minimal. |

---

## 4. Anti-patterns (36–48)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 36 | logger.utils `factory.ts` | globalAdapter.destroy().catch(() => {}) | Empty catch hides failures; log or use onFlushError-style callback. |
| 37 | async.utils raceWithTimeout, timeoutResult, timeout.ts | promise.catch(() => {}) to avoid unhandled rejection | Intentional; add one-line comment: “Prevent unhandled rejection from late settlement.” |
| 38 | cache.utils `memoize.ts` / `memoize-async.ts` | Default cache is `new Map()` with no maxSize | Unbounded growth; document and/or default to LRU with a cap. |
| 39 | logger.utils `factory.ts` | Logger cache is LRU but global; no TTL | Consider TTL or max age so stale loggers don’t live forever. |
| 40 | env.utils `env-manager.ts` | envCache and rawCache are unbounded Map | Consider max size or TTL for long-running processes. |
| 41 | events.utils | Default onError previously logged to console | Already fixed with noop; ensure no other default console in library code. |
| 42 | nextjs.utils `logging-adapter.ts` | createLoggingIntegration is console-based | Document “dev/default only; use app logger in production”. |
| 43 | time.utils `interval-manager.ts` | console.error/log in library | Use optional logger or noop; avoid hard-coded console. |
| 44 | async.utils `polling-manager.ts` | console.error for poll error | Use onError callback only; no default console. |
| 45 | logger.utils `buffered-adapter.ts` | console.error in flush failure | Already uses onFlushError; ensure no direct console. |
| 46 | api.utils `api-factory.ts` | defaultBaseUrl = options.baseUrl ?? "" | Empty string is vague; consider undefined and require baseUrl at call site or document. |
| 47 | object.utils `singleton.ts` | Global __singletons Map on globalThis | Document process isolation and test cleanup (resetSingletonFactory pattern). |
| 48 | function.utils `debounce-throttle.ts` | Multiple clearTimeout branches | Ensure every code path clears timeouts on cancel/flush. |

---

## 5. Feature gaps (49–58)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 49 | object.utils | getByPath/setByPath but no deleteByPath | Document “use getByPath to parent, then delete key” or add deleteByPath. |
| 50 | data.utils | deepDefaults, getByPath, setByPath; no updateByPath | Same as above; document or add small helper. |
| 51 | file.utils | readFileJson<T> no runtime validation | Document; consider optional schema parameter (e.g. Zod) for validation. |
| 52 | api.utils | client() returns Record<string, Promise<unknown>> | Document “infer from route schema at call site”; consider typed client builder. |
| 53 | async.utils | PollingManager has no AbortSignal support | Add signal to start()/constructor so polling can be cancelled. |
| 54 | socket.utils | Reconnecting WebSocket has no send queue backpressure | Document or add max queue size + drop/error behavior. |
| 55 | logger.utils | Buffered adapter has no backpressure API | Document “never blocks; may drop if inner is slow” or add optional backpressure. |
| 56 | cache.utils | memoize/memoizeAsync default cache unbounded | Document and recommend passing LRU or TTL cache for long-lived usage. |
| 57 | resilience.utils | Circuit breaker has no metrics/events | Add optional onStateChange or getState() for observability. |
| 58 | middleware.utils | No compose() for multiple middleware | Add compose(middlewares) helper for stacking. |

---

## 6. Bugs & edge cases (59–70)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 59 | async.utils `polling-manager.ts` | scheduleNext uses setTimeout(callback, ms); callback is async | If pollFn() never resolves, next scheduleNext() never runs; intervalId remains set. On stop() we clear the timer but the promise still hangs. | Consider timeout around pollFn() so a hung poll doesn’t block the next run. |
| 60 | collections.utils TTLCache test | “returns undefined after TTL” uses setTimeout(..., 60) and done() | Flaky if CI is slow; use fake timers (jest.useFakeTimers) or longer TTL + margin. |
| 61 | object.utils `get-set.ts` | getByPath(obj, "") returns obj | Document; ensure no confusion with “missing path” vs “root”. |
| 62 | object.utils `setByPath` | Creates plain objects for missing segments; arrays not supported | Document “path must not contain array indices” or add support. |
| 63 | data.utils `search.utils` | path.split(".").pop() ?? "" | Edge case for empty path; document or guard. |
| 64 | api.utils | buildHandlerContext: req.headers ?? {} | If req.headers is an object with non-string values, type is wrong; document or narrow. |
| 65 | logger.utils `buffered-adapter` | On flush error, entries are re-prepended to buffer; order may change if multiple flushes fail | Document “order preserved per flush batch” or clarify. |
| 66 | socket.utils | Reconnect backoff uses jitter; if maxDelayMs is small, delay can be 0 | Ensure minimum delay (e.g. 1ms) to avoid tight loop. |
| 67 | time.utils `interval-manager` | clearAll clears intervals but may leave dangling timeouts if TTL not cleared | Verify clearInterval/clearTimeout pairing for all managed entries. |
| 68 | cache.utils `in-memory-cache` | Eviction when maxSize is set is insertion-order, not LRU | If documented as LRU, implement LRU; otherwise document “FIFO eviction”. |
| 69 | errors.utils `serialize-error` | Circular references in error metadata | Document or use a safe stringify (e.g. decycled JSON). |
| 70 | env.utils | Dynamic mode reads process.env every time; no cache | Document that dynamic mode bypasses cache. |

---

## 7. Memory leaks & resources (71–80)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 71 | cache.utils `memoize.ts` | Default Map() never evicts | Document “pass bounded cache for long-lived processes”. |
| 72 | cache.utils `memoize-async.ts` | Same as above | Same. |
| 73 | logger.utils `factory.ts` | Logger cache is LRU(1000); no cleanup on adapter change | setAdapter destroys old adapter; verify cache is cleared or doesn’t hold references to old adapter. |
| 74 | events.utils | Subscriptions stored in Map; off() removes | Verify no retain of handler closure when off() is called. |
| 75 | socket.utils | Reconnect timers and heartbeat cleared in close() | Already clears; verify all branches (error, close, abort) clear timers. |
| 76 | async.utils `queue.ts` / `limit.ts` | Abort listeners removed on task run and on reject | Verify removeEventListener is called in all exit paths. |
| 77 | time.utils `interval-manager` | clearAll and clearInterval clear managed entries | Verify no leak of ManagedInterval refs after clear. |
| 78 | logger.utils `buffered-adapter` | flushTimer cleared in destroy(); unref() used | Good; ensure destroy() is documented as required for cleanup. |
| 79 | env.utils `env-manager` | envCache, rawCache; no max size | Consider cap or TTL for server processes that reload env. |
| 80 | annotations.utils | globalMetadataStore is a single Map | Document “global store grows unbounded; prefer createMetadataStore() for scoped use”. |

---

## 8. Latency & performance (81–88)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 81 | file.utils | readFileUtf8/readFileJson are sync in some packages? | Ensure all file APIs used in hot paths are async where appropriate. |
| 82 | object.utils `merge.ts` | Deep merge is O(n) over all keys; no cycle detection | Document “no circular refs” or add cycle detection. |
| 83 | data.utils `search.utils` | searchObject traverses entire tree | Document complexity; consider maxDepth if not already. |
| 84 | logger.utils | Buffered adapter flush is sequential (for-of over entries) | For large buffers, consider batching or parallel if inner adapter supports it. |
| 85 | api.utils | client() builds URL with substitutePath + buildQuery on every call | Acceptable; ensure no unnecessary allocations in hot path. |
| 86 | async.utils `queue.ts` | runNext() is synchronous; many tasks = many microtasks | Document; consider limiting concurrency (already has concurrency option). |
| 87 | collections.utils | TTLCache prune on set() can be O(n) if many expired | Document or add optional lazy expiration. |
| 88 | string.utils | formatString with many placeholders | Ensure no regex or string concat in tight loop; use replace or template. |

---

## 9. Consistency & naming (89–95)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 89 | token-optimizer.utils | markdownStrategy.ts vs toonStrategy.ts vs tonlStrategy.ts | Align filename casing (e.g. all kebab-case *-strategy.ts). |
| 90 | token-optimizer.utils | tokenOptimizer.types.ts vs kebab-case elsewhere | Use token-optimizer.types.ts for consistency. |
| 91 | data.utils | data.extend, data.validate, data.prepare (dot prefix) | Consistent within package; document. |
| 92 | zustand.utils | coverageThreshold 72% branches, 70% functions | Align with 80% if possible or document why lower. |
| 93 | utils/enum vs enum.utils | Two enum locations; enum/ deprecated | Ensure all refs point to enum.utils; remove enum/ when unused. |
| 94 | Jest configs | Some use coverageThreshold.global, some nested | Standardize format across packages. |
| 95 | Test file naming | *-unit.test.ts vs *.unit.test.ts | Already consistent; keep. |

---

## 10. Documentation & README (96–100)

| # | Location | Issue | Rationale |
|---|----------|--------|-----------|
| 96 | file.utils | readFileJson<T> “Typed as T; validate at call site” | Prominent warning in README and JSDoc. |
| 97 | api.utils | client() and handlers() return types (Promise<unknown>) | README already documents; ensure “type from schema” example exists. |
| 98 | object.utils | getByPath return unknown; no “how to type” example | Add one-line “Narrow with type guard or generic wrapper” in README. |
| 99 | CONTRIBUTING.md | Checklist for new packages | Ensure checklist includes “no unbounded caches by default”, “timers/listeners cleaned up”. |
| 100 | Root README / AGENTS.md | List of packages and status | Keep in sync with actual packages; add “scan findings” link to this doc. |

---

## Summary by category

| Category | Count | Focus |
|----------|-------|--------|
| Architecture & file size | 10 | Split large files, reduce global state, consistent structure. |
| TypeScript & type safety | 15 | Reduce any/unknown, document casts, add generics. |
| AI slop & comments | 10 | Trim redundant JSDoc, move prose to README. |
| Anti-patterns | 13 | Unbounded caches, empty catch, console in libs. |
| Feature gaps | 10 | deleteByPath, AbortSignal for polling, backpressure, compose. |
| Bugs & edge cases | 12 | Polling hang, TTL flakiness, path edge cases. |
| Memory leaks & resources | 10 | Bounded memoize cache, env cache cap, global store doc. |
| Latency & performance | 8 | Deep merge cycles, searchObject depth, flush batching. |
| Consistency & naming | 7 | Strategy filenames, coverage thresholds. |
| Documentation | 5 | Unsafe APIs, typing patterns, CONTRIBUTING. |

**Total: 100 tasks.**

---

*Generated from full codebase scan. Prioritize Critical/High first; many Medium/Low items can be batched (e.g. JSDoc trim, test typings).*
