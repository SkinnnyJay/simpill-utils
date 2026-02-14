# ADR-0001: Utils protocols and canonical ownership

## Status

Accepted.

## Context

The `utils/` monorepo has grown with duplicated protocol literals (HTTP methods, correlation headers, env boolean parsing) and overlapping utilities (debounce/throttle, LRU/cache) across packages. This causes:

- **Protocol drift**: `env.utils` uses only `"true"`/`"1"` and `"false"`/`"0"` for boolean parsing; `logger.utils` also accepts `"yes"`/`"no"`. Header names for request/trace IDs are hardcoded in `middleware.utils` only.
- **Type inconsistency**: `api.utils` defines `HttpMethod`; `http.utils` accepts `method: string`.
- **Duplicate implementations**: debounce/throttle exist in `function.utils`, `time.utils`, and `misc.utils`; LRU/cache in `cache.utils`, `collections.utils`, `misc.utils`, and `object.utils`.

## Decisions

### 1. Shared protocols package

- **Decision**: Introduce `@simpill/protocols.utils` as the single source of truth for cross-cutting protocol constants and types.
- **Scope**: HTTP methods (type + const object), correlation header names (`x-request-id`, `x-trace-id`), env boolean parsing policy (truthy/falsy sets), and logger env keys.
- **Rationale**: Prevents drift, gives one place to fix/evolve protocols, and keeps consuming packages decoupled from literal strings.

### 2. Boolean parsing policy

- **Decision**: Canonical policy is **strict**: truthy = `["true", "1"]`, falsy = `["false", "0"]`. No `"yes"`/`"no"` in the shared protocol.
- **Rationale**: `env.utils` already documents avoiding `yes`/`no` for clarity. Logger and other packages that need lenient parsing can extend or wrap the shared policy locally but should not redefine the core set in two places.

### 3. HTTP method typing

- **Decision**: `HttpMethod` and a const object (e.g. `HTTP_METHOD`) live in `protocols.utils`. `api.utils` and `http.utils` import from there; `http.utils` internal `request()` will accept `HttpMethod` (or `string` typed as `HttpMethod` at call sites).
- **Rationale**: Single definition for method names and type; consistent validation and autocomplete across API and HTTP client.

### 4. Correlation headers

- **Decision**: Header names `x-request-id` and `x-trace-id` are defined in `protocols.utils`. `middleware.utils` (and any other package) imports and uses these constants.
- **Rationale**: Same header names everywhere for observability; one place to change if we ever standardize on different names.

### 5. Debounce / throttle canonical home

- **Decision**: **`@simpill/function.utils`** is the canonical package for `debounce` and `throttle`.
- **Rationale**: They are function-level utilities; `time.utils` focuses on time/interval/duration. Re-export or thin wrappers in `time.utils` and `misc.utils` with deprecation notices pointing to `function.utils`.

### 6. LRU / cache canonical home

- **Decision**: **`@simpill/cache.utils`** is the canonical package for LRU map and TTL cache. **`@simpill/collections.utils`** remains the home for richer structures (e.g. `LRUCache` class, `TTLCache`, `MultiMap`, etc.). `misc.utils` and `object.utils` should re-export from `cache.utils` or `collections.utils` where they expose overlapping behavior, with deprecation notes.
- **Rationale**: `cache.utils` is already the dedicated cache package; `collections.utils` holds collection data structures. Avoids three competing “LRU” implementations in the public API.

### 7. Literal-audit constants

- **Decision**: `VALUE_0`, `TIMEOUT_MS_*`, etc. are internal quality artifacts. Prefer moving them to non-exported modules (e.g. `internal/constants.ts`) or grouping under an `internal` namespace; document as “not for public use” if they must remain exported.
- **Rationale**: Reduces public API noise and discourages cross-package coupling on magic-number constants.

### 8. Observability integration

- **Decision**: Provide a thin integration surface (new package or module) that wires `createCorrelationMiddleware` + `runWithRequestContext` + logger `setLogContextProvider` in one recommended path, documented with a single example.
- **Rationale**: Easier onboarding and consistent behavior across apps using middleware, request context, and logger together.

## Inventory (reference)

| Area              | Location(s)                                                                 | Action |
|-------------------|-----------------------------------------------------------------------------|--------|
| HttpMethod        | api.utils shared/types.ts, api.utils shared/constants.ts (GET)             | Move to protocols.utils; consume from there |
| method: string    | http.utils client/create-http-client.ts                                    | Use HttpMethod from protocols.utils |
| Correlation headers | middleware.utils server/correlation-middleware.ts                       | Move to protocols.utils; import in middleware |
| Boolean parsing   | env.utils shared/constants.ts, logger.utils shared/constants.ts           | Shared policy in protocols.utils; env keeps strict; logger can extend |
| Logger env keys   | logger.utils shared/constants.ts (ENV_KEYS, LOG_FORMAT_VALUES)            | Optional: reference or re-export from protocols if we put “log env” there |
| Debounce/throttle | function.utils, time.utils, misc.utils                                     | Canonical: function.utils; deprecate in time.utils, misc.utils |
| LRU/cache         | cache.utils, collections.utils, misc.utils (bounded-lru-map), object.utils | Canonical: cache.utils (+ collections for rich structs); deprecate duplicates |

## Consequences

- New dependency: packages that use protocols or observability will depend on `@simpill/protocols.utils` (and optionally the observability integration).
- Breaking changes: any package that currently exports its own `HttpMethod` or header constants may need a major version bump when switching to imports; re-exports can preserve compatibility during deprecation.
- Maintenance: single place to update protocol values and types; ADR and this inventory should be updated when new protocol surfaces are added.

## Versioning and rollout

- **protocols.utils**: New package, 1.0.0.
- **observability.utils**: New package, 1.0.0.
- **api.utils, http.utils, middleware.utils**: Now depend on protocols.utils; consider major bump if consumers relied on previously exported literal types/constants that were removed or moved.
- **env.utils, logger.utils**: Boolean parsing aligned to strict (logger no longer accepts "yes"/"no"); **breaking** for logger—bump major if semver is enforced.
- **time.utils, misc.utils**: debounce/throttle re-exported from function.utils; same API, no major required unless implementation differences surface.
- **Literal-audit cleanup**: VALUE_0, TIMEOUT_MS_*, etc. moved to internal-constants in api.utils, logger.utils, env.utils; not exported from package index. No consumer-facing break if those were never part of the documented public API.
