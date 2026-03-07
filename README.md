<p align="center">
  <img src="./logo.png" alt="@simpill" width="100%" />
</p>

<p align="center">
  <strong>A collection of lightweight, type-safe TypeScript utility packages for modern JavaScript applications.</strong>
</p>

<p align="center">
  <a href="#philosophy">Philosophy</a> •
  <a href="#repositories">Repositories</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#discoverability">Discoverability</a> •
  <a href="#credits-and-inspiration">Credits</a>
</p>

---

## Philosophy

- **Minimal** — Each package does one thing well with minimal dependencies.
- **Type-safe** — Full TypeScript support with strict mode enabled.
- **Tested** — 80%+ code coverage required for all packages.
- **Consistent** — Unified code style, structure, and tooling across all packages.

Each package is published under the `@simpill` scope on npm. Source code lives in **separate GitHub repositories**; this repo is the landing page and index.

---

## Repositories

Each package has its own repository. Click through for source, README, and contribution instructions.

| Package | Description | Status |
|---------|-------------|--------|
| [**adapters.utils**](https://github.com/SkinnnyJay/adapters.utils) | Adapter helpers, logger and cache adapter interfaces (Node and Edge). | New |
| [**algorithms.utils**](https://github.com/SkinnnyJay/algorithms.utils) | Algorithms: stable merge sort, quick sort, binary search, lower/upper bound (Node and Edge). | New |
| [**annotations.utils**](https://github.com/SkinnnyJay/annotations.utils) | Typed metadata store and annotation helpers for symbols and keys (Node and Edge). | New |
| [**api.utils**](https://github.com/SkinnnyJay/api.utils) | Typed API client with Zod validation, handler registry, and middleware (Node and Edge). | New |
| [**array.utils**](https://github.com/SkinnnyJay/array.utils) | Array utilities: unique, chunk, compact, groupBy, sortBy, flattenOnce (Node and Edge). | New |
| [**async.utils**](https://github.com/SkinnnyJay/async.utils) | Retry failed promises with timeout, delay, and backoff; limit concurrency with Semaphore (Node and Edge). | New |
| [**cache.utils**](https://github.com/SkinnnyJay/cache.utils) | In-memory LRU and TTL cache with memoize; small and tree-shakeable (Node and Edge). | New |
| [**collections.utils**](https://github.com/SkinnnyJay/collections.utils) | Type-safe LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap—no full collections lib (Node and Edge). | New |
| [**crypto.utils**](https://github.com/SkinnnyJay/crypto.utils) | Hash, randomBytes, and timing-safe compare for Node.js. | New |
| [**data.utils**](https://github.com/SkinnnyJay/data.utils) | Data utilities: validate, prepare, lifecycle, extend, config (Node and Edge). | New |
| [**env.utils**](https://github.com/SkinnnyJay/env.utils) | Lightweight, type-safe environment variable utilities for Node.js and Edge Runtime. | Stable |
| [**enum.utils**](https://github.com/SkinnnyJay/enum.utils) | Enum helpers: getEnumValue, isValidEnumValue, EnumHelper (Node and Edge). | New |
| [**errors.utils**](https://github.com/SkinnnyJay/errors.utils) | Typed error classes, error codes, and serializeError for logging and RPC (Node and Edge). | New |
| [**events.utils**](https://github.com/SkinnnyJay/events.utils) | PubSub, observer, and typed event emitter (Node and Edge). | New |
| [**factories.utils**](https://github.com/SkinnnyJay/factories.utils) | Typed factory builder, singleton factory, and error factory helpers (Node and Edge). | New |
| [**file.utils**](https://github.com/SkinnnyJay/file.utils) | Typed file I/O: readFileUtf8, readFileJson, writeFile, ensureDir for Node.js. | New |
| [**function.utils**](https://github.com/SkinnnyJay/function.utils) | Debounce, throttle, once, pipe, and compose with TypeScript inference (Node and Edge). | New |
| [**http.utils**](https://github.com/SkinnnyJay/http.utils) | Fetch with timeout, retry, and typed HTTP client—no axios required (Node and Edge). | New |
| [**ai-image-generated-ai-cli**](https://github.com/simpill/ai-image-generated-ai-cli) | Image AI toolkit: core SDK, CLI (`ai-image-gen`), and prompt discovery web UI (Gemini, OpenAI, xAI). | New |
| [**logger.utils**](https://github.com/SkinnnyJay/logger.utils) | Lightweight, type-safe structured logging with correlation context for Node.js and Edge Runtime. | In Development |
| [**middleware.utils**](https://github.com/SkinnnyJay/middleware.utils) | Framework-agnostic middleware types and correlation ID middleware (Node and Edge). | New |
| [**misc.utils**](https://github.com/SkinnnyJay/misc.utils) | Backend misc: singleton, debounce, throttle, LRU, polling, intervals, enums, once, memoize (Node and Edge). | New |
| [**nextjs.utils**](https://github.com/SkinnnyJay/nextjs.utils) | Next.js App Router helpers: safe server actions, route handlers, request context, middleware. | New |
| [**number.utils**](https://github.com/SkinnnyJay/number.utils) | Number utilities: clamp, roundTo, toInt/Float, isInRange, lerp, sum, avg (Node and Edge). | New |
| [**object.utils**](https://github.com/SkinnnyJay/object.utils) | Type-safe object utilities: pick, omit, merge, get/set by path, guards (Node and Edge). | Stable |
| [**observability.utils**](https://github.com/SkinnnyJay/observability.utils) | Single integration surface for correlation middleware, request context, and logger (Node). | New |
| [**patterns.utils**](https://github.com/SkinnnyJay/patterns.utils) | Composable design patterns: Result/Either, strategySelector, pipeAsync (Node and Edge). | New |
| [**protocols.utils**](https://github.com/SkinnnyJay/protocols.utils) | Shared protocol constants and types for HTTP, correlation, and env parsing (Node and Edge). | New |
| [**react.utils**](https://github.com/SkinnnyJay/react.utils) | Framework-agnostic React utilities: hooks, safe context, stable callbacks, transitions. | New |
| [**request-context.utils**](https://github.com/SkinnnyJay/request-context.utils) | AsyncLocalStorage request context (requestId, traceId) for Node.js logging and tracing. | New |
| [**resilience.utils**](https://github.com/SkinnnyJay/resilience.utils) | Circuit breaker, rate limiter, bulkhead, and jittered backoff for fault-tolerant APIs (Node and Edge). | New |
| [**socket.utils**](https://github.com/SkinnnyJay/socket.utils) | Reconnecting WebSocket client with optional heartbeat (Node and Edge). | New |
| [**string.utils**](https://github.com/SkinnnyJay/string.utils) | String utilities: formatting, casing, trim, slugify (Node and Edge). | New |
| [**test.utils**](https://github.com/SkinnnyJay/test.utils) | Test patterns, faker wrapper, enricher, and test-runner helpers (Node and Edge). | New |
| [**time.utils**](https://github.com/SkinnnyJay/time.utils) | Time utilities: debounce, throttle, interval manager, managed timeout (Node and Edge). | Stable |
| [**token-optimizer.utils**](https://github.com/SkinnnyJay/token-optimizer.utils) | Token optimization utilities: cleaning, strategies, telemetry (Node and Edge). | New |
| [**uuid.utils**](https://github.com/SkinnnyJay/uuid.utils) | Generate and validate UUIDs (v1/v4/v5) with full TypeScript support (Node and Edge). | Stable |
| [**zod.utils**](https://github.com/SkinnnyJay/zod.utils) | Zod schema helpers: builders, safe-parse, transforms, OpenAPI metadata (Node and Edge). | New |
| [**zustand.utils**](https://github.com/SkinnnyJay/zustand.utils) | Zustand store helpers: factory, persist, devtools, slices (Node and Edge). | New |

---

## Quick Start

Install any package from npm:

```bash
npm install @simpill/env.utils
npm install @simpill/logger.utils
npm install @simpill/cache.utils
npm install @simpill/async.utils
npm install @simpill/function.utils
npm install @simpill/string.utils
```

Use the **Repositories** table above to open a package’s GitHub repo for docs, API reference, and examples.

**Consumption:** Every package is consumable **separately** (npm or `github:simpill/<repo>`) and **by this monolith** (run `npm install` at root; all packages land in `node_modules`). Run `npm run verify:deps` to confirm. **No `utils/` folder is required**—package source lives in the GitHub repos above; this repo pulls them in via dependencies. You can remove `utils/` if present.

### Use the main repo in another project

The main project references all util packages via GitHub. To pull in the full set of utils from this repo into another project, add the monorepo as a dependency:

```bash
npm install github:SkinnnyJay/simpill
```

(or add `"@simpill/monorepo": "github:SkinnnyJay/simpill"` to your `package.json`). Installing it will fetch each util from its GitHub repo (`github:SkinnnyJay/adapters.utils`, etc.) so you can import any util in your code:

```ts
import { createAdapter } from "@simpill/adapters.utils";
import { unique } from "@simpill/array.utils";
import { getEnvString } from "@simpill/env.utils";
```

To depend on only one util, install that package from npm or GitHub (e.g. `npm install @simpill/adapters.utils` or `npm install github:SkinnnyJay/adapters.utils`).

### Using the monolith (this repo)

Clone and install from the repo root. All @simpill utils are installed from GitHub into `node_modules` and are usable as-is (e.g. `@simpill/env.utils` ships `dist/` in its repo):

```bash
npm install
```

Then any script or app at the repo root can require/import them, e.g.:

```js
const { getEdgeString } = require("@simpill/env.utils/client");
const { unique } = require("@simpill/array.utils");
```

To confirm all installed packages are resolvable and load correctly:

```bash
npm run verify:deps
npm test
```

`npm test` imports all 38 @simpill packages and prints NODE_ENV; if any package failed to install (e.g. empty folder), re-run `npm install` or `rm -rf node_modules && npm install`.

**Sandbox apps** (e.g. todo-app) live in a separate repo: [simpill-sandbox](https://github.com/simpill/simpill-sandbox). To develop individual util packages, clone their GitHub repos (see [Repositories](#repositories) table).

---

## Discoverability

- **GitHub:** Add topics (e.g. `simpill`, `typescript`, `utilities`, `nodejs`, `edge-runtime`) so the org and repos appear in search. See [.github/TOPICS.md](./.github/TOPICS.md) for a full list.
- **npm:** Every package lists `simpill` and package-specific keywords. Use `npm search simpill` to find all published packages.

---

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to create and maintain packages (and where they live).

---

## Credits and inspiration

We build on and are inspired by the following projects and standards.

### Dependencies

Packages depend on these core libraries (each link goes to the official repository):

| Library | Use in @simpill | Repository |
|--------|------------------|------------|
| [Zod](https://github.com/colinhacks/zod) | Schema validation, API types, safe parsing | [colinhacks/zod](https://github.com/colinhacks/zod) |
| [Zustand](https://github.com/pmndrs/zustand) | Store factory, persist, devtools | [pmndrs/zustand](https://github.com/pmndrs/zustand) |
| [Next.js](https://github.com/vercel/next.js) | App Router, server actions, middleware | [vercel/next.js](https://github.com/vercel/next.js) |
| [React](https://github.com/facebook/react) | Hooks, context, transitions | [facebook/react](https://github.com/facebook/react) |
| [uuid](https://github.com/uuidjs/uuid) | UUID v1/v4/v5 generation and validation | [uuidjs/uuid](https://github.com/uuidjs/uuid) |
| [Faker](https://github.com/faker-js/faker) | Test data and mocks | [faker-js/faker](https://github.com/faker-js/faker) |
| [Biome](https://github.com/biomejs/biome) | Linting and formatting (dev) | [biomejs/biome](https://github.com/biomejs/biome) |
| [Jest](https://github.com/jestjs/jest) | Unit and integration tests (dev) | [jestjs/jest](https://github.com/jestjs/jest) |
| [TypeScript](https://github.com/microsoft/TypeScript) | Type checking and emit | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |

### Inspiration and prior art

- [Lodash](https://github.com/lodash/lodash) — Array, object, and function utility patterns.
- [Vercel](https://github.com/vercel) — Next.js, [t3-env](https://github.com/t3-oss/t3-env), and server/edge patterns.
- [Node.js](https://github.com/nodejs/node) — [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage), `fs`, and runtime separation.
- [RFC 4122](https://www.rfc-editor.org/rfc/rfc4122) — UUID specification.
- [TC39](https://github.com/tc39) — ECMAScript and standard library evolution.

---

## License

ISC
