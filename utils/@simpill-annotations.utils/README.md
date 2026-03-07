## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fannotations.utils.svg)](https://www.npmjs.com/package/@simpill/annotations.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-annotations.utils)
</p>

**npm**
```bash
npm install @simpill/annotations.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-annotations.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-annotations.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createMetadataStore,
  getMetadata,
  setMetadata,
  globalMetadataStore,
} from "@simpill/annotations.utils";

const store = createMetadataStore();
const KEY = Symbol("key");
setMetadata(KEY, "value", store);
console.log(getMetadata<string>(KEY, store)); // "value"
```

---

## Features

| Feature | Description |
|---------|-------------|
| **MetadataStore** | get, set, has, delete — key → value (flat); not per-target like reflect-metadata |
| **createMetadataStore** | New store instance; use for scoped or test-isolated state |
| **globalMetadataStore** | Process-level shared store; avoid string key collisions (use symbols or namespaced keys) |
| **getMetadata** / **setMetadata** | Convenience helpers; omit store to use global; use store.has/delete for has/delete |

---

## API Reference

- **createMetadataStore**() → MetadataStore — new Map-backed store (key → value). Not per-target; one map per store.
- **globalMetadataStore** — single process-level store. Shared by all callers; prefer **createMetadataStore()** for scoped or per-module state.
- **getMetadata**&lt;T&gt;(key, store?) → T | undefined — when store is omitted, uses globalMetadataStore. The store’s **get** uses a type assertion for **T**; the value is not runtime-validated. Ensure the same **T** (or compatible type) was used when **set** was called.
- **setMetadata**&lt;T&gt;(key, value, store?) → void
- **MetadataStore**: get, set, **has**(key), **delete**(key) — use the store directly for has/delete; getMetadata/setMetadata don’t wrap them.
- **MetadataKey** = symbol | string

### reflect-metadata interop

This package is a **flat key → value store** (one key, one value per store). It is **not** the same as `reflect-metadata`, which keys by (target, propertyKey?, key). For per-class or per-property metadata (e.g. decorators that attach to a class or method), use `reflect-metadata` or encode the target in your key (e.g. `Symbol.for(ctor.name)`). Use this package when you need a simple named/symbol-keyed bag (e.g. module-level config, feature flags).

### Global store risks

**globalMetadataStore** is a single process-level Map with no size limit; it grows unbounded as keys are added. Prefer **createMetadataStore()** for scoped or long-lived use. The global store is shared across the whole process; different libraries or modules that use string keys can collide. Prefer **symbol keys** (e.g. `Symbol("myapp:config")`) or **namespaced strings** (e.g. `"myapp:validator"`). For test isolation, pass a **createMetadataStore()** instance instead of using the global.

### has / delete

**has**(key) and **delete**(key) exist on **MetadataStore** only. There are no standalone hasMetadata/deleteMetadata helpers; call **store.has(key)** or **store.delete(key)**. getMetadata/setMetadata use the store’s get/set.

### Key collisions

Keys are global within a store. Use **symbols** for private keys or **prefixed strings** (e.g. `"@myscope/key"`) to avoid clashes with other code using the same store.

### Decorator and DI/validation example

You can set metadata in a decorator and read it later for DI or validation. Example (per-key, not per-target): store a validator schema under a symbol and look it up when validating. For per-class metadata without reflect-metadata, derive a key from the target (e.g. `key = Symbol.for((target as Function).name)`) and use a single store, or use one store per target (e.g. WeakMap&lt;object, MetadataStore&gt;).

### Serialize / snapshot

Stores do not expose **entries()** or iteration. There is no built-in serialize or snapshot. If you need to copy or persist metadata, maintain your own key list or use a store wrapper that records keys.

### Runtime compatibility

No Node-only or DOM APIs; works in Node, browsers, and Edge. Safe to use in any ES environment that supports Map, Symbol, and optional parameters.

### What we don't provide

- **Per-target metadata (reflect-metadata style)** — Stores are flat key → value; there is no (target, propertyKey, key) triple. For per-class or per-property metadata use `reflect-metadata` or encode the target in your key (e.g. `Symbol.for(ctor.name)`).
- **Serialize / snapshot** — No `entries()` or iteration on stores; no built-in way to copy or persist all metadata. Maintain your own key list or a wrapper if you need that.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | Metadata store, get/set/has, global store |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
