<p align="center">
  <img src="./logo.png" alt="@simpill" width="100%" />
</p>

<p align="center">
  <strong>Lightweight, type-safe TypeScript utility packages for modern JavaScript and Node.js.</strong>
</p>

<p align="center">
  <a href="#install">Install</a> •
  <a href="#packages">Packages</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Philosophy

- **Minimal** — One job per package, few dependencies.
- **Type-safe** — TypeScript strict mode, no `any`.
- **Tested** — 80%+ coverage; shared style and tooling.

All packages are in this monorepo and published under the `@simpill` scope on [npm](https://www.npmjs.com/org/simpill).

---

## Install

Install everything (recommended):

```bash
npm install @simpill/utils
```

Or install only what you need:

```bash
npm install @simpill/env.utils @simpill/array.utils @simpill/async.utils
```

---

## Usage

Modern TypeScript/ESM: import from the package(s) you installed.

```ts
import { getEnvString } from "@simpill/env.utils";
import { unique, chunk } from "@simpill/array.utils";
import { delay, retry } from "@simpill/async.utils";
```

Subpath exports (client / server / shared) when a package supports them:

```ts
import { getEdgeString } from "@simpill/env.utils/client";
import { getEnvString } from "@simpill/env.utils/server";
```

Type-only imports:

```ts
import type { AppError } from "@simpill/errors.utils";
```

---

## Packages

| Package | Description |
|---------|-------------|
| [@simpill/adapters.utils](https://www.npmjs.com/package/@simpill/adapters.utils) | Adapter helpers, logger and cache adapter interfaces |
| [@simpill/algorithms.utils](https://www.npmjs.com/package/@simpill/algorithms.utils) | Merge sort, quick sort, binary search, lower/upper bound |
| [@simpill/annotations.utils](https://www.npmjs.com/package/@simpill/annotations.utils) | Typed metadata store and annotation helpers |
| [@simpill/api.utils](https://www.npmjs.com/package/@simpill/api.utils) | Typed API client, Zod validation, handler registry, middleware |
| [@simpill/array.utils](https://www.npmjs.com/package/@simpill/array.utils) | unique, chunk, compact, groupBy, sortBy, partition, zip |
| [@simpill/async.utils](https://www.npmjs.com/package/@simpill/async.utils) | retry, delay, raceWithTimeout, Semaphore |
| [@simpill/cache.utils](https://www.npmjs.com/package/@simpill/cache.utils) | LRU map, TTL cache, memoize |
| [@simpill/collections.utils](https://www.npmjs.com/package/@simpill/collections.utils) | LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap |
| [@simpill/crypto.utils](https://www.npmjs.com/package/@simpill/crypto.utils) | Hash, randomBytes, timing-safe compare (Node) |
| [@simpill/data.utils](https://www.npmjs.com/package/@simpill/data.utils) | validate, prepare, lifecycle, extend, config |
| [@simpill/env.utils](https://www.npmjs.com/package/@simpill/env.utils) | Type-safe env vars (Node and Edge) |
| [@simpill/enum.utils](https://www.npmjs.com/package/@simpill/enum.utils) | getEnumValue, isValidEnumValue, EnumHelper |
| [@simpill/errors.utils](https://www.npmjs.com/package/@simpill/errors.utils) | AppError, error codes, serializeError |
| [@simpill/events.utils](https://www.npmjs.com/package/@simpill/events.utils) | PubSub, observer, typed event emitter |
| [@simpill/factories.utils](https://www.npmjs.com/package/@simpill/factories.utils) | createFactory, singletonFactory, errorFactory |
| [@simpill/file.utils](https://www.npmjs.com/package/@simpill/file.utils) | readFileUtf8, readFileJson, writeFile, ensureDir (Node) |
| [@simpill/function.utils](https://www.npmjs.com/package/@simpill/function.utils) | debounce, throttle, once, pipe, compose |
| [@simpill/http.utils](https://www.npmjs.com/package/@simpill/http.utils) | Fetch with timeout/retry, typed HTTP client |
| [@simpill/logger.utils](https://www.npmjs.com/package/@simpill/logger.utils) | Structured logging with correlation context |
| [@simpill/middleware.utils](https://www.npmjs.com/package/@simpill/middleware.utils) | Middleware types, correlation ID middleware |
| [@simpill/misc.utils](https://www.npmjs.com/package/@simpill/misc.utils) | singleton, debounce, throttle, LRU, polling, once, memoize |
| [@simpill/nextjs.utils](https://www.npmjs.com/package/@simpill/nextjs.utils) | Safe server actions, route helpers, request context |
| [@simpill/number.utils](https://www.npmjs.com/package/@simpill/number.utils) | clamp, roundTo, toInt/Float, isInRange, lerp, sum, avg |
| [@simpill/object.utils](https://www.npmjs.com/package/@simpill/object.utils) | pick, omit, merge, get/set by path, guards |
| [@simpill/observability.utils](https://www.npmjs.com/package/@simpill/observability.utils) | Correlation middleware, request context, logger |
| [@simpill/patterns.utils](https://www.npmjs.com/package/@simpill/patterns.utils) | Result/Either, strategySelector, pipeAsync |
| [@simpill/protocols.utils](https://www.npmjs.com/package/@simpill/protocols.utils) | HTTP/correlation/env protocol constants and types |
| [@simpill/react.utils](https://www.npmjs.com/package/@simpill/react.utils) | useLatest, createSafeContext, useStableCallback |
| [@simpill/request-context.utils](https://www.npmjs.com/package/@simpill/request-context.utils) | AsyncLocalStorage requestId, traceId |
| [@simpill/resilience.utils](https://www.npmjs.com/package/@simpill/resilience.utils) | Circuit breaker, rate limiter, bulkhead, jitter |
| [@simpill/socket.utils](https://www.npmjs.com/package/@simpill/socket.utils) | Reconnecting WebSocket client with heartbeat |
| [@simpill/string.utils](https://www.npmjs.com/package/@simpill/string.utils) | Formatting, casing, trim, slugify |
| [@simpill/test.utils](https://www.npmjs.com/package/@simpill/test.utils) | Test patterns, faker, enricher, runner helpers |
| [@simpill/time.utils](https://www.npmjs.com/package/@simpill/time.utils) | getUnixTimeStamp, add* (days/hours), diff, interval manager |
| [@simpill/token-optimizer.utils](https://www.npmjs.com/package/@simpill/token-optimizer.utils) | Token cleaning, strategies, telemetry |
| [@simpill/uuid.utils](https://www.npmjs.com/package/@simpill/uuid.utils) | generate (v1/v4/v5), validate, isUUID, parseUUID |
| [@simpill/zod.utils](https://www.npmjs.com/package/@simpill/zod.utils) | Schema helpers, safe-parse, transforms, OpenAPI metadata |
| [@simpill/zustand.utils](https://www.npmjs.com/package/@simpill/zustand.utils) | Store factory, persist, devtools, slices |

Source: [github.com/SkinnnyJay/simpill-utils](https://github.com/SkinnnyJay/simpill-utils)

---

## Contributing

- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to add and maintain packages in this monorepo.
- [.github/TOPICS.md](./.github/TOPICS.md) — GitHub/npm topics and keywords.

---

## License

ISC
