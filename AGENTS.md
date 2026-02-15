# Repository Guidelines

This monorepo hosts lightweight, type-safe TypeScript utility packages under the `@simpill` namespace.

**For detailed instructions on creating new packages, see [CONTRIBUTING.md](./CONTRIBUTING.md).**

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@simpill/env.utils` | Type-safe environment variable utilities | Stable |
| `@simpill/logger.utils` | Structured logging with correlation context | In Development |
| `@simpill/object.utils` | Object utilities (pick, omit, merge, get/set, guards) | Stable |
| `@simpill/misc.utils` | Backend misc: singleton, debounce, throttle, LRU, polling, enums, UUID, once, memoize | New |
| `@simpill/cache.utils` | LRU map, TTL cache, memoize | New |
| `@simpill/async.utils` | raceWithTimeout, delay, retry | New |
| `@simpill/function.utils` | debounce, throttle, once, pipe, compose, arguments, annotations | New |
| `@simpill/string.utils` | formatting, builders, casing, rich text | New |
| `@simpill/test.utils` | Test patterns, faker, enricher, vitest/jest helpers | New |
| `@simpill/events.utils` | PubSub, observer, event emitter | New |
| `@simpill/data.utils` | data validate/prepare/lifecycle/extend, config | New |
| `@simpill/time.utils` | Date/time: getUnixTimeStamp, add* (days/hours/…), diff, delta, add(duration), startOfDay/endOfDay, debounce, throttle, interval manager | Stable |
| `@simpill/uuid.utils` | UUID: generate (v1/v4/v5), validate, isUUID, parseUUID, compareUUIDs | Stable |
| `@simpill/crypto.utils` | Hash, randomBytesSecure, randomBytesHex, timingSafeEqualBuffer (Node) | New |
| `@simpill/file.utils` | readFileUtf8, readFileJson, writeFileUtf8, writeFileJson, ensureDir (Node) | New |
| `@simpill/errors.utils` | AppError, error codes, serializeError | New |
| `@simpill/patterns.utils` | Result/Either, strategySelector, pipeAsync | New |
| `@simpill/factories.utils` | createFactory, singletonFactory, errorFactory | New |
| `@simpill/adapters.utils` | createAdapter, LoggerAdapter, CacheAdapter, memoryCacheAdapter | New |
| `@simpill/algorithms.utils` | mergeSort, quickSort, binarySearch, lowerBound, upperBound (no @simpill deps) | New |
| `@simpill/api.utils` | Typed API factory: fetch client, handler registry, Zod, middleware, retry/timeout | New |
| `@simpill/annotations.utils` | createMetadataStore, getMetadata, setMetadata | New |
| `@simpill/array.utils` | unique, chunk, compact, groupBy, sortBy, partition, zip, keyBy, countBy, intersection, difference, union, sample, shuffle, take, drop | New |
| `@simpill/collections.utils` | LinkedList, Vector, Queue, Stack, Deque, CircularBuffer, LRU/TTL cache, MultiMap, BiMap, OrderedMap, TypedSet | New |
| `@simpill/request-context.utils` | AsyncLocalStorage request context (requestId, traceId), runWithRequestContext, getRequestContext | New |
| `@simpill/http.utils` | Fetch with timeout, retry, createHttpClient, isRetryableStatus | New |
| `@simpill/resilience.utils` | Circuit breaker, rate limiter, bulkhead, withJitter | New |
| `@simpill/middleware.utils` | Framework-agnostic middleware types, createCorrelationMiddleware | New |
| `@simpill/socket.utils` | Reconnecting WebSocket client with heartbeat | New |
| `@simpill/zod.utils` | Zod schema helpers: builders, safe-parse, transforms, OpenAPI metadata | New |
| `@simpill/zustand.utils` | Zustand store helpers: factory, persist, devtools, slices | New |
| `@simpill/react.utils` | React hooks: useLatest, createSafeContext, useStableCallback, useLazyState, useDeferredUpdate | New |
| `@simpill/nextjs.utils` | Next.js: createSafeAction, route helpers, withRequestContext, withCorrelation | New |

## Project Structure

```
@simpill/
├── utils/                      # One folder per package: @simpill-<name>.utils
│   └── @simpill-{name}.utils/
│       ├── src/                # Source code
│       │   ├── client/         # Edge/browser runtime (no fs)
│       │   ├── server/         # Node.js runtime (full access)
│       │   └── shared/         # Runtime-agnostic utilities
│       ├── __tests__/          # Tests (mirrors src/ structure)
│       ├── scripts/            # Build/check scripts
│       ├── package.json
│       ├── tsconfig.json
│       ├── jest.config.js
│       └── biome.json
├── .github/workflows/          # CI/CD per package
├── CONTRIBUTING.md             # Package creation guide
└── README.md                   # Monorepo overview
```

## Development Commands

Run from any package directory (e.g., `cd utils/@simpill-env.utils`):

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage reports |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |
| `npm run check:fix` | Fix all lint and format issues |
| `npm run verify` | Run all pre-push checks |

## Coding Standards

- **TypeScript strict mode** required
- **Biome** for linting/formatting (2-space indent, double quotes, semicolons, 100-char lines)
- **80%+ test coverage** enforced
- **400 line max** per file

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `EnvManager` |
| Functions/Variables | camelCase | `getEnvString` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_TIMEOUT` |
| Files | dot-separated | `env.utils.ts` |
| Tests | `{name}.unit.test.ts` | `env-manager.unit.test.ts` |

## Commit Guidelines

- Use short, imperative messages: `Add edge env helpers`
- Keep PRs focused with summary and test commands
- Link related issues

## Literal audit

To execute the [literal audit](docs/LITERAL_AUDIT_FINDINGS.md) per package, use the findings doc and **literal-hunter** (`.claude/skills/literal-hunter`) for centralizing literals. For batch workflows across packages, see [docs/LITERAL_AUDIT_BATCH_TASKS.md](docs/LITERAL_AUDIT_BATCH_TASKS.md) if present.

Project skills live in `.claude/skills/`. Commands, rules, and agents live in `.cursor/commands`, `.cursor/rules`, and `.cursor/agents`. See `.cursor/README.md` for a full index.

## Security

- Never commit `.env` files (git-ignored)
- Document environment variable defaults
- Add tests for parsing behavior
