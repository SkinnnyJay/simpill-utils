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
| **CacheAdapter** | get, set, delete, has — sync or async; no getMany/deleteMany; memoryCacheAdapter has no TTL/eviction |
| **LoggerAdapter** | debug, info, warn, error — minimal; use with logger.utils setLoggerAdapter |
| **memoryCacheAdapter** | Sync Map-based cache; for TTL/LRU use cache.utils |
| **consoleLoggerAdapter** | Wraps console-like (log/info/warn/error) into LoggerAdapter |
| **createAdapter** | Identity: use to type a superset implementation as interface T (e.g. for DI) |

---

## API Reference

- **CacheAdapter**&lt;K, V&gt; — get, set, delete, has. Methods may be **sync or async** (return type is union); consumers should await when using an async implementation. No getMany/deleteMany; implement batch ops on top of get/set/delete if needed.
- **LoggerAdapter** — debug, info, warn, error (message + ...args). Minimal interface; for structured log types use your logger (e.g. @simpill/logger.utils) and wrap with an adapter that implements this shape.
- **memoryCacheAdapter**&lt;K, V&gt;() → CacheAdapter&lt;K, V&gt; — **sync**, Map-based; **no TTL or eviction**. For TTL/LRU use @simpill/cache.utils and wrap with an adapter if needed.
- **consoleLoggerAdapter**(consoleLike) → LoggerAdapter — uses log for debug/info when debug/info are missing.
- **createAdapter**&lt;T&gt;(impl: T) → T — **identity**: returns impl unchanged. Use when your implementation has a **superset** of interface T and you want a typed view (e.g. for DI or testing) so callers only see T.

### createAdapter value

Use **createAdapter** when you have a concrete implementation that does more than the interface (e.g. a Redis client with get/set/del plus connect/disconnect). Passing it through createAdapter&lt;CacheAdapter&gt;(redisImpl) gives you a value typed as CacheAdapter so dependents don’t depend on the concrete type. No runtime behavior change.

### Sync vs async

**CacheAdapter** allows each method to be sync or async (return type is V | undefined | Promise&lt;V | undefined&gt;, etc.). **memoryCacheAdapter** is sync. If you implement an async cache (e.g. Redis), return Promises and document that callers must await.

### Error handling

Adapters do not catch or transform errors. If get/set/delete or logger methods throw, the caller sees the error. Implementations (e.g. Redis) should document failure behavior; wrap in try/catch or use Result at the call site if you need consistent error handling.

### logger.utils usage

Use **LoggerAdapter** as the contract for @simpill/logger.utils: pass **consoleLoggerAdapter**(console) or a custom object implementing debug/info/warn/error. The logger factory can then use setLoggerAdapter(myAdapter). No built-in pino/winston adapters; implement an object that forwards to pino/winston with the same four methods.

### What we don’t provide

- **Pino / Winston adapters** — No pre-built adapters for pino or winston. Implement an object with `debug`, `info`, `warn`, `error` that forwards to your logger (e.g. `pino.info(msg)` or `winston.info(msg)`).
- **Structured log types** — **LoggerAdapter** is message + ...args only. For structured fields (ECS, log levels, correlation IDs), use @simpill/logger.utils and pass an adapter that implements this interface; the logger layer handles structure.

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
