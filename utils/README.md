# Utils

Utilities are organized into **packages** (publishable, template-conformant) and **legacy subfolders** (no package structure).

The standard package layout is defined in the repo [CONTRIBUTING.md](../CONTRIBUTING.md) and the [template/](../template) directory. Every package under `utils/@simpill-` should follow: `src/{client,server,shared}/`, `__tests__/`, `scripts/` (check.sh, install-hooks.sh, pre-push.sh), and root files (AGENTS.md, CLAUDE.md, biome.json, jest.config.js, tsconfig.json, .gitignore, .npmignore).

---

## Packages (template-conformant)

Packages live under `utils/@simpill-` (e.g. `utils/@simpill-env.utils/`).

| Folder | Description |
|---------|-------------|
| **async.utils/** | `@simpill/async.utils` – raceWithTimeout, retry, delay, polling |
| **cache.utils/** | `@simpill/cache.utils` – LRU map, TTL cache, memoize |
| **data.utils/** | `@simpill/data.utils` – validate, prepare, lifecycle, extend, config |
| **env.utils/** | `@simpill/env.utils` – type-safe env vars (client/server) |
| **enum.utils/** | `@simpill/enum.utils` – getEnumValue, isValidEnumValue, EnumHelper |
| **events.utils/** | `@simpill/events.utils` – PubSub, observer, event emitter |
| **function.utils/** | `@simpill/function.utils` – debounce, throttle, once, pipe, compose |
| **logger.utils/** | `@simpill/logger.utils` – structured logging |
| **misc.utils/** | `@simpill/misc.utils` – misc backend utilities |
| **object.utils/** | `@simpill/object.utils` – object helpers, guards, get/set, merge |
| **protocols.utils/** | `@simpill/protocols.utils` – shared HTTP, correlation, env boolean, log env keys |
| **string.utils/** | `@simpill/string.utils` – formatting, builders, casing, rich text |
| **test.utils/** | `@simpill/test.utils` – test patterns, faker, enricher, vitest/jest helpers |
| **time.utils/** | `@simpill/time.utils` – debounce, throttle, interval manager, managed timeout |
| **token-optimizer.utils/** | `@simpill/token-optimizer.utils` – token cleaning, strategies, telemetry |
| **uuid.utils/** | `@simpill/uuid.utils` – generateUUID, validateUUID, isUUID, UUIDHelper |

Import from the package, e.g. `@simpill/env.utils`, `@simpill/env.utils/client`, `@simpill/env.utils/shared`.

**Protocols and observability:** Shared protocol constants (HTTP methods, correlation headers, env boolean parsing) live in `@simpill/protocols.utils`. Packages such as `api.utils`, `http.utils`, `middleware.utils`, `env.utils`, and `logger.utils` consume them. For a single integration path for correlation middleware + request context + logger, use `@simpill/observability.utils` (see [docs/adr/0001-utils-protocols-and-canonical-ownership.md](../docs/adr/0001-utils-protocols-and-canonical-ownership.md)).

---

## Deprecated / legacy folders

| Folder | Note |
|--------|------|
| **async/** | Empty; use **async.utils** package. |
| **enum/** | Use **enum.utils** package. (Can be removed after migrating imports.) |

---

## Template conformance

When adding or auditing packages, ensure each has:

- **Structure**: `src/client/`, `src/server/`, `src/shared/` (each with `index.ts`), `src/index.ts`, `__tests__/` mirroring src, `scripts/` with `check.sh`, `install-hooks.sh`, `pre-push.sh`
- **Config**: `package.json` (exports, scripts), `tsconfig.json`, `jest.config.js`, `biome.json`
- **Docs**: `README.md`, `AGENTS.md`, `CLAUDE.md`
- **Ignore**: `.gitignore`, `.npmignore`

Run from a package directory: `npm run verify` (or `./scripts/check.sh`) to validate.
