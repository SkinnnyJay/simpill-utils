## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ffactories.utils.svg)](https://www.npmjs.com/package/@simpill/factories.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-factories.utils)
</p>

**npm**
```bash
npm install @simpill/factories.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-factories.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-factories.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createFactory,
  singletonFactory,
  singletonAsyncFactory,
  errorFactory,
} from "@simpill/factories.utils";

// object defaults (shallow merge, as always) …
const createUser = createFactory({ id: 0, name: "Anonymous" });
const user = createUser({ name: "Alice" });

// … or function defaults: fresh nested objects per build + 1-based sequence
const createPost = createFactory(({ sequence }) => ({
  id: sequence,
  tags: [] as string[],
}));
const posts = createPost.buildList(3); // ids 1, 2, 3 — independent tags arrays

const createAdmin = createUser.extend({ name: "Admin" }); // derived factory

const getConfig = singletonFactory(() => ({ env: "dev" }));
const getDb = singletonAsyncFactory(async () => connect()); // shared in-flight init; rejections retry

const createNotFound = errorFactory(Error, "Not found", "NOT_FOUND");
```

---

## Features

| Feature | Description |
|---------|-------------|
| **createFactory** | Typed factory: shallow merge of defaults + partial overrides. Defaults may be an object (nested refs shared, as before) or a function `({ sequence }) => T` (fresh nested state per build + auto sequence). Returned factory also exposes `buildList` / `extend` / `rewindSequence` |
| **singletonFactory** | Lazy single instance (factory runs on first get). Caches ANY result — including `undefined`. Throwing factories are not cached (next get retries); circular initialization throws instead of overflowing the stack |
| **singletonAsyncFactory** | Async twin: concurrent first callers share ONE in-flight initialization; a rejected init is evicted so the next get retries (no permanently poisoned cache) |
| **resetSingletonFactory** | Clears cached instance for a getter from singletonFactory / singletonAsyncFactory |
| **errorFactory** | (Ctor, defaultMessage, defaultCode?, settings?) → (message?, code?, options?) => E. Subclass type E preserved, `code` typed on the result, `options.cause` chains errors (ES2022), wrapper frame removed from stacks via Error.captureStackTrace (opt out with `{ cleanStack: false }`) |

---

## Import Paths

```ts
import { ... } from "@simpill/factories.utils";         // Everything
import { ... } from "@simpill/factories.utils/client";  // Client
import { ... } from "@simpill/factories.utils/server";  // Server
import { ... } from "@simpill/factories.utils/shared";  // Shared only
```

---

## API Reference

- **createFactory**&lt;T&gt;(defaults) → FactoryFn&lt;T&gt; — **merge**: shallow; each call returns `{ ...defaults, ...overrides }`. Object defaults are not mutated, but their nested objects are shared by reference across produced instances (unchanged). Function defaults `({ sequence }) => T` run per build: fresh nested objects, 1-based auto-incrementing sequence.
- **FactoryFn**&lt;T&gt; — the returned factory: callable `(overrides?: Partial<T>) => T`, plus **buildList**(count, overrides? | (index, ctx) => Partial&lt;T&gt;) (count must be a non-negative integer, else RangeError), **extend**(partial | ctx => partial) → derived FactoryFn (own sequence; call-time overrides still win), **rewindSequence**() → resets the counter to 1.
- **singletonFactory**&lt;T&gt;(factory) → () => T — **lazy**: factory runs only on first get(). All results cache — including `undefined`/`null`/falsy. A throwing factory is NOT cached (next get retries). A factory that calls its own getter throws a clear circular-initialization error.
- **singletonAsyncFactory**&lt;T&gt;(factory: () => Promise&lt;T&gt; | T) → () => Promise&lt;T&gt; — factory is invoked synchronously on first get and the promise is cached, so concurrent first callers share ONE in-flight initialization. A rejected initialization is evicted (next get retries). Sync throws surface as rejections.
- **resetSingletonFactory**(getter) → void — pass a getter from **singletonFactory** or **singletonAsyncFactory**; clears the cached instance/promise so the next get() re-runs the factory. Use in tests to isolate state.
- **errorFactory**&lt;E&gt;(Ctor, defaultMessage, defaultCode?, settings?) → (message?, code?, options?) => E & { code?: string } — **Ctor** can be Error or a subclass; the concrete subclass type (its fields included) is preserved on the result, and `code` is visible without casts. `options.cause` attaches an underlying error (ES2022 convention). Where `Error.captureStackTrace` exists, the creator's wrapper frame is removed so stacks start at YOUR call site; disable with `settings: { cleanStack: false }` on bulk hot paths (~2x faster creation).
- **ErrorConstructor** — new (message: string) => Error
- **ErrorFactoryOptions** — { cause?: unknown } · **ErrorFactorySettings** — { cleanStack?: boolean } · **BuildContext** — { sequence: number } · **ListOverrides**&lt;T&gt;

### Merge behavior (createFactory)

Overrides are applied **shallowly**: only top-level keys are merged. Nested objects in `defaults` are copied by reference, so mutating a nested object in one produced instance affects others. Use immutable defaults or deep clone inside the factory if you need independent nested state.

### buildList

`factory.buildList(n)` builds `n` items. Pass a shared partial (`factory.buildList(3, { active: false })`) or a per-index function (`factory.buildList(3, (i) => ({ id: i * 10 }))`). Combined with function defaults, each item gets its own sequence value and fresh nested objects.

### Async factories

**singletonAsyncFactory** covers the connect-once case: the first get() starts initialization, concurrent callers await the same promise, and a REJECTED initialization is evicted from the cache so the next get() retries instead of replaying the failure forever (the pitfall in the naive `p ??= factory()` pattern).

### resetSingletonFactory example

```ts
const getDb = singletonFactory(() => ({ connected: true }));
getDb(); // creates instance
resetSingletonFactory(getDb);
getDb(); // creates a new instance (e.g. for next test)
```

### Default mutation and concurrency

**createFactory** does not mutate the `defaults` object; each call spreads it. **singletonFactory** is not thread-safe by design (single-threaded JS); the first caller runs the factory, others receive the cached value. For async initialization use **singletonAsyncFactory** — concurrent first callers share the same in-flight promise.

### DI usage

Use **singletonFactory**(() => new Service(deps)) as a getter and pass that getter to consumers so they call getter() for the same instance. Combine with **createFactory** for configurable default options when constructing dependencies.

### Comparison

- **createFactory** is similar to **createWithDefaults** in object.utils and **createFixture** in test.utils; this one returns a reusable factory function.
- **singletonFactory** is similar to **createSingleton** in object.utils (different API: symbol-keyed cache vs key string).
- **errorFactory** has no direct equivalent in other @simpill packages; use with **AppError** from errors.utils for typed codes.

### What we don't provide

- **Deep merge in createFactory** — Overrides are applied **shallowly**. With object defaults, nested objects are shared by reference; use function defaults (`() => ({ ... })`) for independent nested state per instance. Overrides always replace whole top-level keys.
- **Transient params / associations / afterBuild hooks** — heavier fishery-style machinery is out of scope; compose with **extend** and function defaults instead.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createFactory (defaults + overrides), singletonFactory (lazy), errorFactory (message/code) |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
