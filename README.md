<p align="center">
  <img src="./logo.png" alt="@simpill" width="100%" />
</p>

<p align="center">
  <strong>A collection of lightweight, type-safe TypeScript utility packages for modern JavaScript applications.</strong>
</p>

<p align="center">
  <a href="#philosophy">Philosophy</a> •
  <a href="#packages">Packages</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#repository-structure">Repository Structure</a> •
  <a href="#development">Development</a> •
  <a href="#credits-and-inspiration">Credits</a>
</p>

---

## Philosophy

- **Minimal** - Each package does one thing well with minimal dependencies
- **Type-safe** - Full TypeScript support with strict mode enabled
- **Tested** - 80%+ code coverage required for all packages
- **Consistent** - Unified code style, structure, and tooling across all packages

## Packages

Every package is self-contained, type-safe, and published under the `@simpill` scope. Each links to its directory under `utils/`.

| Package | Description | Status |
|---------|-------------|--------|
| [`@simpill/adapters.utils`](./utils/@simpill-adapters.utils) | Adapter helpers, logger and cache adapter interfaces (Node and Edge). | New |
| [`@simpill/algorithms.utils`](./utils/@simpill-algorithms.utils) | Algorithms: stable merge sort, quick sort, binary search, lower/upper bound (Node and Edge). | New |
| [`@simpill/annotations.utils`](./utils/@simpill-annotations.utils) | Typed metadata store and annotation helpers for symbols and keys (Node and Edge). | New |
| [`@simpill/api.utils`](./utils/@simpill-api.utils) | Typed API client with Zod validation, handler registry, and middleware (Node and Edge). | New |
| [`@simpill/array.utils`](./utils/@simpill-array.utils) | Array utilities: unique, chunk, compact, groupBy, sortBy, flattenOnce (Node and Edge). | New |
| [`@simpill/async.utils`](./utils/@simpill-async.utils) | Retry failed promises with timeout, delay, and backoff; limit concurrency with Semaphore (Node and Edge). | New |
| [`@simpill/cache.utils`](./utils/@simpill-cache.utils) | In-memory LRU and TTL cache with memoize; small and tree-shakeable (Node and Edge). | New |
| [`@simpill/collections.utils`](./utils/@simpill-collections.utils) | Type-safe LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap—no full collections lib (Node and Edge). | New |
| [`@simpill/crypto.utils`](./utils/@simpill-crypto.utils) | Hash, randomBytes, and timing-safe compare for Node.js. | New |
| [`@simpill/data.utils`](./utils/@simpill-data.utils) | Data utilities: validate, prepare, lifecycle, extend, config (Node and Edge). | New |
| [`@simpill/env.utils`](./utils/@simpill-env.utils) | Lightweight, type-safe environment variable utilities for Node.js and Edge Runtime. | Stable |
| [`@simpill/enum.utils`](./utils/@simpill-enum.utils) | Enum helpers: getEnumValue, isValidEnumValue, EnumHelper (Node and Edge). | New |
| [`@simpill/errors.utils`](./utils/@simpill-errors.utils) | Typed error classes, error codes, and serializeError for logging and RPC (Node and Edge). | New |
| [`@simpill/events.utils`](./utils/@simpill-events.utils) | PubSub, observer, and typed event emitter (Node and Edge). | New |
| [`@simpill/factories.utils`](./utils/@simpill-factories.utils) | Typed factory builder, singleton factory, and error factory helpers (Node and Edge). | New |
| [`@simpill/file.utils`](./utils/@simpill-file.utils) | Typed file I/O: readFileUtf8, readFileJson, writeFile, ensureDir for Node.js. | New |
| [`@simpill/function.utils`](./utils/@simpill-function.utils) | Debounce, throttle, once, pipe, and compose with TypeScript inference (Node and Edge). | New |
| [`@simpill/http.utils`](./utils/@simpill-http.utils) | Fetch with timeout, retry, and typed HTTP client—no axios required (Node and Edge). | New |
| [`@simpill/logger.utils`](./utils/@simpill-logger.utils) | Lightweight, type-safe structured logging with correlation context for Node.js and Edge Runtime. | In Development |
| [`@simpill/middleware.utils`](./utils/@simpill-middleware.utils) | Framework-agnostic middleware types and correlation ID middleware (Node and Edge). | New |
| [`@simpill/misc.utils`](./utils/@simpill-misc.utils) | Backend misc: singleton, debounce, throttle, LRU, polling, intervals, enums, once, memoize (Node and Edge). | New |
| [`@simpill/nextjs.utils`](./utils/@simpill-nextjs.utils) | Next.js App Router helpers: safe server actions, route handlers, request context, middleware. | New |
| [`@simpill/number.utils`](./utils/@simpill-number.utils) | Number utilities: clamp, roundTo, toInt/Float, isInRange, lerp, sum, avg (Node and Edge). | New |
| [`@simpill/object.utils`](./utils/@simpill-object.utils) | Type-safe object utilities: pick, omit, merge, get/set by path, guards (Node and Edge). | Stable |
| [`@simpill/observability.utils`](./utils/@simpill-observability.utils) | Single integration surface for correlation middleware, request context, and logger (Node). | New |
| [`@simpill/patterns.utils`](./utils/@simpill-patterns.utils) | Composable design patterns: Result/Either, strategySelector, pipeAsync (Node and Edge). | New |
| [`@simpill/protocols.utils`](./utils/@simpill-protocols.utils) | Shared protocol constants and types for HTTP, correlation, and env parsing (Node and Edge). | New |
| [`@simpill/react.utils`](./utils/@simpill-react.utils) | Framework-agnostic React utilities: hooks, safe context, stable callbacks, transitions. | New |
| [`@simpill/request-context.utils`](./utils/@simpill-request-context.utils) | AsyncLocalStorage request context (requestId, traceId) for Node.js logging and tracing. | New |
| [`@simpill/resilience.utils`](./utils/@simpill-resilience.utils) | Circuit breaker, rate limiter, bulkhead, and jittered backoff for fault-tolerant APIs (Node and Edge). | New |
| [`@simpill/socket.utils`](./utils/@simpill-socket.utils) | Reconnecting WebSocket client with optional heartbeat (Node and Edge). | New |
| [`@simpill/string.utils`](./utils/@simpill-string.utils) | String utilities: formatting, casing, trim, slugify (Node and Edge). | New |
| [`@simpill/test.utils`](./utils/@simpill-test.utils) | Test patterns, faker wrapper, enricher, and test-runner helpers (Node and Edge). | New |
| [`@simpill/time.utils`](./utils/@simpill-time.utils) | Time utilities: debounce, throttle, interval manager, managed timeout (Node and Edge). | Stable |
| [`@simpill/token-optimizer.utils`](./utils/@simpill-token-optimizer.utils) | Token optimization utilities: cleaning, strategies, telemetry (Node and Edge). | New |
| [`@simpill/uuid.utils`](./utils/@simpill-uuid.utils) | Generate and validate UUIDs (v1/v4/v5) with full TypeScript support (Node and Edge). | Stable |
| [`@simpill/zod.utils`](./utils/@simpill-zod.utils) | Zod schema helpers: builders, safe-parse, transforms, OpenAPI metadata (Node and Edge). | New |
| [`@simpill/zustand.utils`](./utils/@simpill-zustand.utils) | Zustand store helpers: factory, persist, devtools, slices (Node and Edge). | New |

## Quick Start

Install any package independently:

```bash
npm install @simpill/env.utils
npm install @simpill/logger.utils
npm install @simpill/misc.utils
npm install @simpill/cache.utils
npm install @simpill/async.utils
npm install @simpill/function.utils
npm install @simpill/string.utils
```

## Repository Structure

```
@simpill/
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       ├── {pkg}-ci.yml        # CI workflow per package
│       └── {pkg}-release.yml   # Release workflow per package
├── .claude/                    # Claude Code: skills, docs (see .claude/README.md)
│   ├── skills/                 # Project skills (canonical)
│   ├── docs/                   # Architecture/reference docs
│   └── agents/                 # Pointer to .cursor/agents
├── .cursor/                    # Cursor IDE: commands, rules, agents (see .cursor/README.md)
│   ├── commands/               # Command prompts
│   ├── rules/                  # Always-apply and file-scoped rules (.mdc)
│   └── agents/                 # Agent definitions (canonical)
├── utils/                      # One folder per package: @simpill-<name>.utils
│   ├── @simpill-adapters.utils/
│   ├── @simpill-env.utils/
│   ├── @simpill-object.utils/
│   ├── ...                     # (all packages: @simpill-<name>.utils)
│   └── @simpill-zustand.utils/
├── AGENTS.md                   # Repository guidelines for AI agents
├── CLAUDE.md                   # Claude-specific instructions
├── CONTRIBUTING.md             # How to create new packages
└── README.md                   # This file
```

## Development

Each package is self-contained with its own dependencies and scripts. Navigate to a package directory to work on it:

```bash
cd utils/@simpill-env.utils

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint & format
npm run check:fix
```

To **build and test every utils package** from the repo root:

```bash
./scripts/verify-all-utils.sh
```

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to create and maintain packages.

Each package under `utils/*` has its own README with installation, quick start, API reference, and runnable examples (e.g. [env.utils](./utils/@simpill-env.utils/README.md).).

## Creating a New Package

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed instructions on creating new packages.

## Code Quality Standards

All packages must meet these requirements:

- **TypeScript strict mode** enabled
- **80%+ test coverage** (enforced)
- **Biome** for linting and formatting
- **Jest** for testing
- **Pre-push hooks** for quality gates

## Versioning

Each package is versioned independently following [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backwards compatible)
- **PATCH** - Bug fixes (backwards compatible)

## Credits and inspiration

We build on and are inspired by the following projects and standards.

### Dependencies

Packages in this monorepo depend on these core libraries (each link goes to the official repository):

| Library | Use in @simpill | Repository |
|--------|------------------|------------|
| [Zod](https://github.com/colinhacks/zod) | Schema validation, API types, safe parsing (`zod.utils`, `api.utils`, `nextjs.utils`, `token-optimizer.utils`) | [colinhacks/zod](https://github.com/colinhacks/zod) |
| [Zustand](https://github.com/pmndrs/zustand) | Store factory, persist, devtools (`zustand.utils`) | [pmndrs/zustand](https://github.com/pmndrs/zustand) |
| [Next.js](https://github.com/vercel/next.js) | App Router, server actions, middleware (`nextjs.utils`) | [vercel/next.js](https://github.com/vercel/next.js) |
| [React](https://github.com/facebook/react) | Hooks, context, transitions (`react.utils`, `nextjs.utils`) | [facebook/react](https://github.com/facebook/react) |
| [uuid](https://github.com/uuidjs/uuid) | UUID v1/v4/v5 generation and validation (`uuid.utils`) | [uuidjs/uuid](https://github.com/uuidjs/uuid) |
| [Faker](https://github.com/faker-js/faker) | Test data and mocks (`test.utils`) | [faker-js/faker](https://github.com/faker-js/faker) |
| [Biome](https://github.com/biomejs/biome) | Linting and formatting (dev, all packages) | [biomejs/biome](https://github.com/biomejs/biome) |
| [Jest](https://github.com/jestjs/jest) | Unit and integration tests (dev, all packages) | [jestjs/jest](https://github.com/jestjs/jest) |
| [TypeScript](https://github.com/microsoft/TypeScript) | Type checking and emit (dev + peer, all packages) | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) |

### Inspiration and prior art

- [Lodash](https://github.com/lodash/lodash) — Array, object, and function utility patterns.
- [Vercel](https://github.com/vercel) — Next.js, [t3-env](https://github.com/t3-oss/t3-env), and server/edge patterns.
- [Node.js](https://github.com/nodejs/node) — [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage), `fs`, and runtime separation.
- [RFC 4122](https://www.rfc-editor.org/rfc/rfc4122) — UUID specification.
- [TC39](https://github.com/tc39) — ECMAScript and standard library evolution.

## License

ISC
