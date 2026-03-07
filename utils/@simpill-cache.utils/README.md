## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fcache.utils.svg)](https://www.npmjs.com/package/@simpill/cache.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-cache.utils)
</p>

**npm**
```bash
npm install @simpill/cache.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-cache.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-cache.utils` or `npm link` from that directory.

---

## Usage

```ts
import { LRUMap, memoize, InMemoryCache } from "@simpill/cache.utils";

const lru = new LRUMap<string, number>(100);
lru.set("key", 42);
const value = lru.get("key");

const fn = memoize((x: number) => expensive(x), { cache: new LRUMap(50) });
```

---

## Features

| Feature | Description |
|---------|-------------|
| **LRUMap** | In-memory LRU map with max size |
| **InMemoryCache** | TTL-capable in-memory cache (no max size; use defaultTtlMs or bounded keys to avoid unbounded growth) |
| **memoize** | Memoize with optional custom cache (e.g. LRUMap) |
| **memoizeAsync** | Memoize async functions with optional custom cache |
| **TTLCache** | TTL cache with max size (server) |
| **RedisCache** | Redis-backed cache via adapter interface (server) |

---

## Import Paths

```ts
import { ... } from "@simpill/cache.utils";         // Everything
import { ... } from "@simpill/cache.utils/client"; // Client
import { ... } from "@simpill/cache.utils/server"; // Server
import { ... } from "@simpill/cache.utils/shared"; // Shared only
```

---

## API Reference

- **LRUMap**&lt;K, V&gt;(maxSize) — get, set, has, size, clear
- **InMemoryCache** — get, set, has, delete, clear, size. Optional defaultTtlMs and maxSize (LRU eviction); without both the cache is unbounded.
- **memoize**(fn, options?) — options: key, cache (MemoizeCache). **Default cache is unbounded**; for long-lived processes pass a bounded cache (e.g. **LRUMap** or **InMemoryCache** with maxSize).
- **memoizeAsync**(fn, options?) — async memoize with custom key/cache. Same unbounded-default note; use a bounded cache to avoid unbounded growth.
- **TTLCache** — server TTL cache with max size
- **RedisCache** — server cache wrapper (requires RedisCacheAdapter)

### memoizeAsync

Memoizes async functions: same arguments return the same promise (cached). Options: `key` (custom key function), `cache` (custom cache instance), `ttlMs` (default TTL when using the default InMemoryCache). Unlike sync `memoize`, concurrent calls with the same key share one in-flight promise when the cache is empty — no built-in “in-flight dedupe” flag; the default behavior reuses the same promise until it settles and is stored. Use a bounded cache (e.g. `InMemoryCache({ maxSize: 500, defaultTtlMs: 60000 })`) to avoid unbounded growth.

### Invalidation and eviction

- **LRUMap / TTLCache:** Eviction is automatic (oldest-first when max size is reached; TTL expiry for TTLCache). No manual invalidation API beyond `clear()` or `delete(key)` where available.
- **InMemoryCache:** Supports `delete(key)`, `clear()`, and optional TTL + maxSize; eviction when full is LRU.
- **RedisCache:** Use adapter `delete(key)` or key patterns for invalidation; TTL is typically set per key by the adapter.

### Bounded growth (InMemoryCache)

`InMemoryCache` is unbounded unless you set **maxSize** and/or **defaultTtlMs**. For long-running processes, prefer e.g. `new InMemoryCache({ maxSize: 1000, defaultTtlMs: 60_000 })` so entries expire and size is capped (LRU eviction when maxSize is reached).

### RedisCache: serialization and keys

Values are stored as JSON (serialized on set, parsed on get). **get(key)** returns the parsed value; the generic type is not validated at runtime — **validate at use site** (e.g. Zod) if you need a guaranteed shape. Use a key prefix (e.g. `myapp:user:${id}`) to namespace keys and avoid collisions. The adapter is responsible for encoding; ensure your Redis client stores strings (UTF-8). See server example below.

### Stale-while-revalidate (SWR)

This package does not implement SWR. To serve stale and revalidate in the background, wrap your fetch in logic that returns cached value immediately and triggers an async refresh; then update the cache when the refresh completes.

### What we don't provide

- **Hit/miss counters or metrics** — Caches expose `size`, get, set, delete, clear only. For hit/miss stats wrap the cache or use a backend (e.g. Redis) that provides them.
- **SWR** — No stale-while-revalidate; implement with immediate cache return plus background refresh and cache update.
- **getMany / deleteMany** — No batch get or delete; call get/delete in a loop or use an adapter that supports batching.

### Server: TTLCache and RedisCache examples

```ts
import { TTLCache, RedisCache } from "@simpill/cache.utils/server";

// TTL in-memory cache (5 min TTL; entries pruned on access)
const ttl = new TTLCache<string, User>(300_000);
ttl.set("user:1", user);
const u = ttl.get("user:1");

// Redis: pass an adapter implementing get(key), set(key, value, { px }), del(key)
const redisAdapter = {
  async get(key: string) { return client.get(key); },
  async set(key: string, value: string, opts?: { px?: number }) {
    if (opts?.px) await client.set(key, value, "PX", opts.px);
    else await client.set(key, value);
  },
  async del(key: string) { await client.del(key); },
};
const redis = new RedisCache<User>(redisAdapter, { keyPrefix: "myapp", defaultTtlMs: 60_000 });
await redis.set("user:1", user);
const u2 = await redis.get("user:1");
```

### Cache stats and metrics

This package does **not** expose hit/miss counters, eviction counts, or metrics. **LRUMap**, **InMemoryCache**, and **TTLCache** provide **size** (and **get**/ **set**/ **delete**/ **clear**); they do not track hits or misses. For metrics, wrap the cache: e.g. a thin wrapper that increments `hits` on **get** when a value is found and `misses` when not, or use your monitoring (e.g. log cache size periodically). **RedisCache** delegates to the adapter; if your Redis client or adapter exposes stats, use those.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | LRUMap, memoize, InMemoryCache |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
