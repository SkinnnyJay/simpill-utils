# Publishing @simpill Packages: GitHub, npm, and Package Layout

## Will packages show as `@simpill/<packagename>`?

**Yes.** The package name in each `package.json` is already `@simpill/<name>.utils`. How that appears on **npm** and **GitHub** depends on how you set up accounts, not on the repo contents.

---

## npm: Scope and organization

- **Scoped packages** like `@simpill/env.utils` always show on npm as `@simpill/env.utils`; the scope is the part before the first `/`.
- **Who “owns” the scope** is determined by npm accounts:
  - If your **npm username** is `simpill`, you can publish `@simpill/...` under your user. They will show under your user profile.
  - If you create an **npm organization** named `simpill`, you publish under that org. All packages then show under **https://www.npmjs.com/org/simpill** and you can add other members and teams.

**Recommendation:** Create an **npm organization** named `simpill` so all packages live under one place (`/org/simpill`) and you can manage access and members in one place.

- Create org: https://www.npmjs.com/org/create (choose name `simpill` if available).
- Publish with access: `npm publish --access public` (required for scoped packages the first time, or set in each package.json or `.npmrc`).

You do **not** need to “claim” anything extra for the scope beyond having the org (or user) named `simpill`.

---

## GitHub: Repo and org

- **GitHub** does not use the `@` scope. Repos are `github.com/<owner>/<repo>`.
- Your **package.json** `repository` / `homepage` / `bugs` URLs should point at the **real** repo where this monorepo lives.

Right now many packages use URLs like:

- `https://github.com/SkinnnyJay/simpill.git`

That implies a repo named `@simpill/adapters.utils` under the user `SkinnnyJay`. In a **monorepo**, you usually have **one repo** and many packages inside it, so the canonical form is:

- One repo, e.g. `github.com/<owner>/<repo>` (e.g. `simpill/simpill` or `SkinnnyJay/simpill`).
- In each package, set `repository.url` to that repo and `repository.directory` to the package path, e.g. `utils/@simpill-adapters.utils`.

**Recommendation:** If you want a clean “brand” on GitHub:

1. Create a **GitHub organization** named `simpill` (if you want `github.com/simpill/...`).
2. Create a single repo (e.g. `simpill` or `utils`) and put this monorepo there.
3. In every package `package.json`, set:
   - `repository`: `https://github.com/simpill/<repo>.git` and `"directory": "utils/<name>.utils"`
   - `homepage` and `bugs.url` to the same base URL (and for bugs, `/issues`).

Then all packages will show on GitHub under one org/repo; npm will still show them as `@simpill/<packagename>`.

---

## One big package vs many small ones

You said you want to **limit dependencies** and prefer **one logical “product”** implemented as **many small modules**. Your current layout does that:

- **One scope:** `@simpill`
- **Many packages:** `@simpill/env.utils`, `@simpill/adapters.utils`, etc.
- **Consumers** install only what they use: `npm install @simpill/env.utils @simpill/object.utils` (small dependency set, tree-shakeable).
- **No single “mega” package** that pulls in everything.

So: checking in all current packages and publishing them as-is will give you exactly that: many small `@simpill/<packagename>` packages on npm, with minimal dependency surface per app. You do **not** need to merge them into one large package for that.

---

## Folder layout (per package)

Each package under `utils/` follows the same structure. Example for `adapters.utils`:

```
utils/
└── adapters.utils/
    ├── package.json          # name: "@simpill/adapters.utils"
    ├── tsconfig.json
    ├── jest.config.js
    ├── biome.json
    ├── README.md
    ├── src/
    │   ├── index.ts           # main re-exports
    │   ├── client/            # Edge/browser (no fs)
    │   │   └── index.ts
    │   ├── server/            # Node (full access)
    │   │   └── index.ts
    │   └── shared/            # Runtime-agnostic
    │       └── index.ts
    ├── __tests__/             # mirrors src (client/server/shared, unit/integration)
    ├── scripts/               # check.sh, install-hooks.sh
    ├── dist/                  # build output (git-ignored)
    └── coverage/              # test coverage (git-ignored)
```

Subpath exports in `package.json`:

- `@simpill/adapters.utils` → main
- `@simpill/adapters.utils/client`
- `@simpill/adapters.utils/server`
- `@simpill/adapters.utils/shared`

---

## How each package looks (quick reference)

| npm name | Folder | Description |
|----------|--------|-------------|
| `@simpill/adapters.utils` | `utils/@simpill-adapters.utils` | Adapter helpers, logger/cache adapter interfaces |
| `@simpill/algorithms.utils` | `utils/@simpill-algorithms.utils` | Merge sort, quick sort, binary search, lower/upper bound |
| `@simpill/annotations.utils` | `utils/@simpill-annotations.utils` | Typed metadata store, annotation helpers |
| `@simpill/api.utils` | `utils/@simpill-api.utils` | Typed API client, Zod, handler registry, middleware |
| `@simpill/array.utils` | `utils/@simpill-array.utils` | unique, chunk, compact, groupBy, sortBy, etc. |
| `@simpill/async.utils` | `utils/@simpill-async.utils` | Retry, timeout, delay, Semaphore |
| `@simpill/cache.utils` | `utils/@simpill-cache.utils` | LRU, TTL cache, memoize |
| `@simpill/collections.utils` | `utils/@simpill-collections.utils` | LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap |
| `@simpill/crypto.utils` | `utils/@simpill-crypto.utils` | Hash, randomBytes, timing-safe compare (Node) |
| `@simpill/data.utils` | `utils/@simpill-data.utils` | validate, prepare, lifecycle, extend, config |
| `@simpill/env.utils` | `utils/@simpill-env.utils` | Type-safe env vars (Node + Edge) |
| `@simpill/enum.utils` | `utils/@simpill-enum.utils` | getEnumValue, isValidEnumValue, EnumHelper |
| `@simpill/errors.utils` | `utils/@simpill-errors.utils` | Typed errors, error codes, serializeError |
| `@simpill/events.utils` | `utils/@simpill-events.utils` | PubSub, observer, typed event emitter |
| `@simpill/factories.utils` | `utils/@simpill-factories.utils` | Factory builder, singleton, error factory |
| `@simpill/file.utils` | `utils/@simpill-file.utils` | readFileUtf8, readFileJson, writeFile, ensureDir (Node) |
| `@simpill/function.utils` | `utils/@simpill-function.utils` | debounce, throttle, once, pipe, compose |
| `@simpill/http.utils` | `utils/@simpill-http.utils` | Fetch timeout/retry, typed HTTP client |
| `@simpill/logger.utils` | `utils/@simpill-logger.utils` | Structured logging, correlation context |
| `@simpill/middleware.utils` | `utils/@simpill-middleware.utils` | Middleware types, correlation ID middleware |
| `@simpill/misc.utils` | `utils/@simpill-misc.utils` | Singleton, debounce, throttle, LRU, polling, etc. |
| `@simpill/nextjs.utils` | `utils/@simpill-nextjs.utils` | Next.js App Router helpers, safe actions, middleware |
| `@simpill/number.utils` | `utils/@simpill-number.utils` | clamp, roundTo, toInt/Float, isInRange, lerp |
| `@simpill/object.utils` | `utils/@simpill-object.utils` | pick, omit, merge, get/set, guards |
| `@simpill/observability.utils` | `utils/@simpill-observability.utils` | Correlation middleware, request context, logger |
| `@simpill/patterns.utils` | `utils/@simpill-patterns.utils` | Result/Either, strategySelector, pipeAsync |
| `@simpill/protocols.utils` | `utils/@simpill-protocols.utils` | Shared protocol constants and types |
| `@simpill/react.utils` | `utils/@simpill-react.utils` | Hooks, safe context, stable callbacks |
| `@simpill/request-context.utils` | `utils/@simpill-request-context.utils` | AsyncLocalStorage request context |
| `@simpill/resilience.utils` | `utils/@simpill-resilience.utils` | Circuit breaker, rate limiter, bulkhead |
| `@simpill/socket.utils` | `utils/@simpill-socket.utils` | Reconnecting WebSocket client |
| `@simpill/string.utils` | `utils/@simpill-string.utils` | Formatting, casing, trim, slugify |
| `@simpill/test.utils` | `utils/@simpill-test.utils` | Test patterns, faker, enricher |
| `@simpill/time.utils` | `utils/@simpill-time.utils` | debounce, throttle, interval manager |
| `@simpill/token-optimizer.utils` | `utils/@simpill-token-optimizer.utils` | Token cleaning, strategies, telemetry |
| `@simpill/uuid.utils` | `utils/@simpill-uuid.utils` | UUID generate/validate (v1/v4/v5) |
| `@simpill/zod.utils` | `utils/@simpill-zod.utils` | Zod helpers, safe-parse, transforms |
| `@simpill/zustand.utils` | `utils/@simpill-zustand.utils` | Zustand factory, persist, devtools, slices |

(If you add or remove packages, update this table and the root README.)

---

## Pre-publish checklist

Use this before publishing any package (or the whole set) to npm and before relying on GitHub links.

### npm

- [ ] **Scope owner:** Create npm **organization** `simpill` (or confirm npm user `simpill`) so `@simpill/*` is yours.
- [ ] **Access:** Use `npm publish --access public` for each scoped package (or set `"publishConfig": { "access": "public" }` in package.json).
- [ ] **Auth:** `npm login` with an account that has publish rights to the `@simpill` scope.
- [ ] **Version:** Set or bump `version` in each package (e.g. 1.0.0 for first publish).
- [ ] **Build:** From each package dir: `npm run build` (and ideally `npm run verify`) so `dist/` is up to date; `prepublishOnly` will run build on publish.
- [ ] **Dependencies:** Packages that depend on other `@simpill/*` packages must use published versions (or `workspace:*` if you use a monorepo tool that supports it) before publishing; no `file:../` in published manifest if those deps are on npm.

### GitHub

- [ ] **Org/repo:** Create GitHub org `simpill` (optional) and one monorepo (e.g. `simpill` or `simpill-utils`).
- [ ] **Push:** Ensure this codebase is pushed to that repo (e.g. `main` branch).
- [ ] **package.json links:** In every package, set:
  - `repository`: `"url": "https://github.com/simpill/<repo>.git"`, `"directory": "utils/<name>.utils"`
  - `homepage`: `"https://github.com/simpill/<repo>/tree/main/utils/<name>.utils#readme"` (or your default branch)
  - `bugs`: `"url": "https://github.com/simpill/<repo>/issues"`
  Replace `<repo>` and default branch if different.

### Per-package (repeat for each)

- [ ] `name` is `@simpill/<name>.utils`.
- [ ] `main`, `types`, and `exports` point at `dist/` and match CONTRIBUTING (`.`, `./client`, `./server`, `./shared`).
- [ ] `files` includes `dist` and `README.md`.
- [ ] `scripts.prepublishOnly` runs build.
- [ ] No stray `file:../` in `dependencies` for packages that are published to npm (or convert to workspace protocol / published versions).

---

## Publish script

A script automates **GitHub push** and **npm publish** in the correct dependency order and rewrites `file:../` to `^version` for each package before publishing (then restores `package.json`).

### Prerequisites

1. **GitHub:** Install [GitHub CLI](https://cli.github.com/) and run `gh auth login` so the repo can be pushed.
2. **npm:** Log in with an account that can publish to the `@simpill` scope: `npm login`.

### Usage

From the repo root:

```bash
# Full run: push to GitHub, then publish all packages to npm (with confirmations)
npm run publish
# or: ./scripts/publish-all.sh

# Dry run: no GitHub push; npm publish --dry-run for each package
./scripts/publish-all.sh --dry-run

# Only npm (skip GitHub push)
./scripts/publish-all.sh --skip-github
# or
./scripts/publish-all.sh --npm-only

# Skip confirmation prompts
./scripts/publish-all.sh --yes
```

### What it does

1. **GitHub (unless `--skip-github`):** Checks `gh auth status`, then runs `git push`.
2. **npm:** Checks `npm whoami`, then for each package in **topological order** (dependencies first):
   - Backs up `utils/<name>.utils/package.json`
   - Replaces every `@simpill/*` `file:../` dependency with `^<version>` (from that package’s current version)
   - Runs `npm publish --access public` (or `--dry-run` when using `--dry-run`)
   - Restores `package.json` from backup

So you keep `file:../` in the repo for local development; the script only rewrites for the publish step.

### Separate packages and synced metadata

- **Published separately:** Each package is its own npm package (e.g. `@simpill/async.utils`, `@simpill/errors.utils`). When someone installs one, npm resolves its `@simpill/*` dependencies by version range from the registry.
- **Version refs between packages:** The publish script rewrites `file:../` to `^<version>` only in the manifest that gets published. So the **version references** between packages are correct: the published `@simpill/async.utils` will list `@simpill/errors.utils: "^1.0.0"` etc., and npm will install the right versions.
- **Links (repository, homepage, bugs):** The script does **not** change these. Whatever is in each `package.json` is what gets published. So:
  - If you want every package to point at the **same monorepo** (e.g. `github.com/simpill/simpill` with `directory: "utils/@simpill-async.utils"`), set `repository`, `homepage`, and `bugs` in each package once—or run the sync script below and commit.
  - After that, every published package on npm will have consistent links to the same repo and directory.

To sync repository/homepage/bugs across all packages to one base URL (run once, then commit):

```bash
# Example: set base to https://github.com/simpill/simpill, branch main
REPO_BASE="https://github.com/simpill/simpill" BRANCH="main" node scripts/lib/sync-repo-links.js
```

(See `scripts/lib/sync-repo-links.js` for usage. Omit to leave existing links unchanged.)

### Optional: verify before publishing

Run the monorepo verify script (if present) before publishing:

```bash
npm run utils:verify
# or: ./scripts/utils-verify-all.sh
```

Then run `npm run publish` or `./scripts/publish-all.sh` (or with `--dry-run` first).

---

## Summary

- **npm:** They will show as `@simpill/<packagename>`. Create an npm **organization** `simpill` (or use user `simpill`) so all packages are under one scope.
- **GitHub:** Create a **GitHub org** `simpill` and one monorepo if you want clean URLs; then fix every package’s `repository` / `homepage` / `bugs` to that repo and `directory`.
- **Strategy:** Your current setup (many small packages under one scope) already limits dependencies and gives one “family” of modules; no need to merge into one large package.
- **Folders:** Each package under `utils/<name>.utils/` is already laid out as in CONTRIBUTING; use the table above as the “how each package looks” reference and the checklist before publishing.
- **Script:** Use `npm run publish` or `./scripts/publish-all.sh` (with `--dry-run` first) to push to GitHub and publish all packages to npm in dependency order; see [Publish script](#publish-script) above.
