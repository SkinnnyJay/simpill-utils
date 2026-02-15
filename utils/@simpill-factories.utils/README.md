<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/factories.utils" width="100%" />
</p>

<p align="center">
  <strong>Typed factory builder, singleton factory, and error factory helpers</strong>
</p>

<p align="center">
  createFactory, singletonFactory, errorFactory—type-safe and lightweight.
</p>

**Features:** Type-safe · Node & Edge · Tree-shakeable

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

## Installation

```bash
npm install @simpill/factories.utils
```

---

## Quick Start

```typescript
import {
  createFactory,
  singletonFactory,
  errorFactory,
} from "@simpill/factories.utils";

const createUser = createFactory({ id: 0, name: "Anonymous" });
const user = createUser({ name: "Alice" });

const getConfig = singletonFactory(() => ({ env: "dev" }));
const createNotFound = errorFactory(Error, "Not found", "NOT_FOUND");
```

---

## Features

| Feature | Description |
|---------|-------------|
| **createFactory** | Typed factory: shallow merge of defaults + partial overrides; no deep merge; nested refs shared |
| **singletonFactory** | Lazy single instance (factory runs on first get); use resetSingletonFactory in tests |
| **resetSingletonFactory** | Clears cached instance for a getter from singletonFactory |
| **errorFactory** | (Ctor, defaultMessage, defaultCode?) → (message?, code?) => Error; Ctor can be a subclass |

---

## Import Paths

```typescript
import { ... } from "@simpill/factories.utils";         // Everything
import { ... } from "@simpill/factories.utils/client";  // Client
import { ... } from "@simpill/factories.utils/server";  // Server
import { ... } from "@simpill/factories.utils/shared";  // Shared only
```

---

## API Reference

- **createFactory**&lt;T&gt;(defaults) → (overrides?: Partial&lt;T&gt;) => T — **merge**: shallow; each call returns `{ ...defaults, ...overrides }`. Defaults are not mutated, but nested objects in defaults are shared by reference across produced instances.
- **singletonFactory**&lt;T&gt;(factory) → () => T — **lazy**: factory runs only on first get(). No eager init; for async singletons, wrap with a promise/cache pattern yourself.
- **resetSingletonFactory**(getter) → void — pass the getter returned by **singletonFactory**; clears the cached instance so the next get() calls the factory again. Use in tests to isolate state.
- **errorFactory**(Ctor, defaultMessage, defaultCode?) → (message?, code?) => Error — **Ctor** can be Error or a subclass (e.g. `class MyError extends Error {}`). The returned function sets `code` on the instance when defaultCode or code is provided.
- **ErrorConstructor** — new (message: string) => Error

### Merge behavior (createFactory)

Overrides are applied **shallowly**: only top-level keys are merged. Nested objects in `defaults` are copied by reference, so mutating a nested object in one produced instance affects others. Use immutable defaults or deep clone inside the factory if you need independent nested state.

### buildList

There is no **buildList** helper. To build a list of factory-produced items:  
`Array.from({ length: n }, (_, i) => createItem(overrides?.[i]))`  
or use **createEnricher** / **createFixture** from `@simpill/test.utils` for list-style defaults.

### Async factories

**singletonFactory** is synchronous. For an async singleton (e.g. connect-once), cache a Promise and share it: e.g. `let p: Promise<T> | null = null; const get = () => p ??= factory();`.

### resetSingletonFactory example

```typescript
const getDb = singletonFactory(() => ({ connected: true }));
getDb(); // creates instance
resetSingletonFactory(getDb);
getDb(); // creates a new instance (e.g. for next test)
```

### Default mutation and concurrency

**createFactory** does not mutate the `defaults` object; each call spreads it. **singletonFactory** is not thread-safe by design (single-threaded JS); the first caller runs the factory, others receive the cached value. No locking; if the factory is async, wrap with a shared Promise as above.

### DI usage

Use **singletonFactory**(() => new Service(deps)) as a getter and pass that getter to consumers so they call getter() for the same instance. Combine with **createFactory** for configurable default options when constructing dependencies.

### Comparison

- **createFactory** is similar to **createWithDefaults** in object.utils and **createFixture** in test.utils; this one returns a reusable factory function.
- **singletonFactory** is similar to **createSingleton** in object.utils (different API: symbol-keyed cache vs key string).
- **errorFactory** has no direct equivalent in other @simpill packages; use with **AppError** from errors.utils for typed codes.

### What we don't provide

- **buildList** — No helper to build a list of N factory-produced items; use **Array.from({ length: n }, (_, i) => createItem(overrides?.[i]))** or **@simpill/test.utils** createEnricher/createFixture.
- **Async singletonFactory** — **singletonFactory** is sync; for async singletons (e.g. connect-once) cache a shared Promise and expose a getter that returns it.
- **Deep merge in createFactory** — Overrides are applied **shallowly**; nested objects in defaults are shared by reference. Use immutable defaults or deep clone inside the factory if you need independent nested state.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createFactory (defaults + overrides), singletonFactory (lazy), errorFactory (message/code) |

---

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
