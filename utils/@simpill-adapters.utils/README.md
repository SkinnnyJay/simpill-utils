## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fadapters.utils.svg)](https://www.npmjs.com/package/@simpill/adapters.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-adapters.utils)
</p>

**npm**
```bash
npm install @simpill/adapters.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-adapters.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-adapters.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createAdapter,
  memoryCacheAdapter,
  consoleLoggerAdapter,
} from "@simpill/adapters.utils";

const cache = memoryCacheAdapter<string, number>();
cache.set("x", 1);
const logger = consoleLoggerAdapter(console);
logger.info("Hello");
const wrapped = createAdapter(myImpl);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **CacheAdapter** | get, set (with optional advisory ttlMs), delete, has — sync or async; optional clear/getMany/setMany/deleteMany/keys capabilities (keyv-style) |
| **AsyncCacheAdapter** | Fully promise-based cache shape; get one via asAsyncCacheAdapter |
| **LoggerAdapter** | debug, info, warn, error — minimal; use with logger.utils setLoggerAdapter |
| **memoryCacheAdapter** | Sync Map-based cache; optional lazy TTL (no timers, edge-safe) and LRU maxSize eviction with onEvict callback |
| **asAsyncCacheAdapter** | Normalizes any CacheAdapter (sync/async/mixed) to all-Promise; batch/clear fall back to singular ops |
| **namespacedCacheAdapter** | Key-prefixed view of a shared string-keyed backend; clear() only touches its own namespace |
| **noopCacheAdapter** | Stores nothing — disable caching in DI without branching |
| **consoleLoggerAdapter** | Wraps console-like into LoggerAdapter; any missing method (incl. warn/error) falls back to log |
| **noopLoggerAdapter** | Frozen logger that discards everything |
| **prefixLoggerAdapter** | Prepends a prefix to every message of a wrapped logger |
| **levelFilterLoggerAdapter** | Drops calls below a minimum level (debug < info < warn < error) |
| **createAdapter** | Identity: compile-time-only typed view of a superset implementation (type param must be explicit) |
| **scopedAdapter** | Runtime-narrowed view: only listed members exist, methods bound to the implementation |

---

## API Reference

- **CacheAdapter**&lt;K, V&gt; — get, set(key, value, ttlMs?), delete, has. Methods may be **sync or async** (return type is union); consumers should await when using an async implementation, or normalize once with **asAsyncCacheAdapter**. `ttlMs` is advisory (implementations without TTL may ignore it). Optional capabilities: clear, getMany, setMany (entries `{ key, value, ttlMs? }`, keyv convention), deleteMany, keys.
- **AsyncCacheAdapter**&lt;K, V&gt; — the fully promise-based shape: every method (including batch ops, clear, keys) present and returning a Promise.
- **LoggerAdapter** — debug, info, warn, error (message + ...args). Minimal interface; for structured log types use your logger (e.g. @simpill/logger.utils) and wrap with an adapter that implements this shape.
- **memoryCacheAdapter**&lt;K, V&gt;(options?) → MemoryCacheAdapter&lt;K, V&gt; — **sync**, Map-based. With no options it behaves exactly like a plain Map. Options: `ttlMs` (default TTL, lazy keyv-style expiry at read time — **no timers**, edge-safe), `maxSize` (LRU eviction, recency updated on get), `onEvict(key, value, reason)` with reason `"evicted" | "expired"`. Per-set `ttlMs` overrides the default; NaN/zero/negative/Infinity ttls throw instead of creating immortal or instantly-dead entries. Implements clear/getMany/setMany/deleteMany/keys.
- **asAsyncCacheAdapter**(cache) → AsyncCacheAdapter — normalizes sync/async/mixed adapters. Batch ops use the adapter's native getMany/setMany/deleteMany when present, otherwise fall back to singular ops. clear() uses native clear, falls back to keys()+delete, and otherwise rejects with a descriptive TypeError instead of silently doing nothing.
- **namespacedCacheAdapter**(cache, namespace, separator?) → AsyncCacheAdapter&lt;string, V&gt; — prefixes every key so multiple consumers share one backend without collisions. clear()/keys() cover keys written through the wrapper, so clearing one namespace never touches a sibling's entries.
- **noopCacheAdapter**() → CacheAdapter — stores nothing (get → undefined, has → false). Disable caching via DI without call-site branching.
- **consoleLoggerAdapter**(consoleLike) → LoggerAdapter — any missing method (debug, info, **warn, error**) falls back to log, so a `{ log }`-only object is valid. Methods are looked up at call time, so spies patched in after wrapping are honored.
- **noopLoggerAdapter** — frozen LoggerAdapter that discards everything.
- **prefixLoggerAdapter**(logger, prefix) → LoggerAdapter — prepends prefix to every message.
- **levelFilterLoggerAdapter**(logger, minLevel) → LoggerAdapter — forwards only calls at or above minLevel; unknown levels throw RangeError. **LOG_LEVELS** / **LogLevel** exported.
- **createAdapter**&lt;T&gt;(impl: T) → T — **identity**: returns impl unchanged. The type parameter must be **explicit** (`createAdapter<CacheAdapter>(redisImpl)`); when inferred, T becomes the concrete type and no narrowing happens. Compile-time only: at runtime every superset member is still reachable.
- **scopedAdapter**(impl, members) → Pick&lt;T, K&gt; — runtime-narrowed view: only listed members exist on the result, methods are **bound** to impl (destructuring keeps `this` — destructuring a raw Map method throws), non-function members are live getters.

### createAdapter value

Use **createAdapter** when you have a concrete implementation that does more than the interface (e.g. a Redis client with get/set/del plus connect/disconnect). Passing it through createAdapter&lt;CacheAdapter&gt;(redisImpl) gives you a value typed as CacheAdapter so dependents don’t depend on the concrete type. No runtime behavior change.

### Sync vs async

**CacheAdapter** allows each method to be sync or async (return type is V | undefined | Promise&lt;V | undefined&gt;, etc.). **memoryCacheAdapter** is sync. If you implement an async cache (e.g. Redis), return Promises and document that callers must await.

### Error handling

Adapters do not catch or transform errors. If get/set/delete or logger methods throw, the caller sees the error. Implementations (e.g. Redis) should document failure behavior; wrap in try/catch or use Result at the call site if you need consistent error handling.

### logger.utils usage

Use **LoggerAdapter** as the contract for @simpill/logger.utils: pass **consoleLoggerAdapter**(console) or a custom object implementing debug/info/warn/error. The logger factory can then use setLoggerAdapter(myAdapter). No built-in pino/winston adapters; implement an object that forwards to pino/winston with the same four methods.

### What we don’t provide

- **Pino / Winston adapters** — No pre-built adapters for pino or winston. Implement an object with `debug`, `info`, `warn`, `error` that forwards to your logger (e.g. `pino.info(msg)` or `winston.info(msg)`); combine with prefixLoggerAdapter / levelFilterLoggerAdapter as needed.
- **Structured log types** — **LoggerAdapter** is message + ...args only. For structured fields (ECS, log levels, correlation IDs), use @simpill/logger.utils and pass an adapter that implements this interface; the logger layer handles structure.
- **Timer-based cache expiry** — memoryCacheAdapter expiry is lazy (checked at read time). Entries that are never read again stay in the Map until read, evicted, or cleared; use maxSize to bound memory.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createAdapter, memoryCacheAdapter, consoleLoggerAdapter |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
