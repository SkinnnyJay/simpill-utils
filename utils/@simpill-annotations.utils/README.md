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
  createMetadataKey,
  setAnnotation,
  getInheritedAnnotation,
} from "@simpill/annotations.utils";

// Key/value metadata store (typed keys: no assertions, no <T> at call sites)
const store = createMetadataStore();
const RETRIES = createMetadataKey<number>("retries");
store.set(RETRIES, 3);
store.get(RETRIES); // number | undefined

// Per-target annotations (WeakMap-backed, GC'd with the target)
class Base {}
class Child extends Base {}
setAnnotation(Base, "serializable", true);
getInheritedAnnotation<boolean>(Child, "serializable"); // true — walks the prototype chain
```

---

## Features

| Feature | Description |
|---------|-------------|
| **MetadataStore** | get, set, has, delete, getOrSet, clear, size, keys/values/entries, iterable |
| **createMetadataStore** | New store instance; optional entries seed for snapshot/copy |
| **createMetadataKey** | Typed symbol keys: `TypedMetadataKey<T>` makes get/set infer and enforce T |
| **globalMetadataStore** | ONE process-level store even with duplicate package copies (Symbol.for registry) |
| **Per-target annotations** | setAnnotation/getAnnotation/hasAnnotation/deleteAnnotation keyed (target, key); WeakMap-backed |
| **Inherited lookup** | getInheritedAnnotation/hasInheritedAnnotation walk the prototype chain (subclasses see base annotations) |
| **createAnnotationStore** | Isolated per-target store for scoped or test-isolated state |
| **TC39 decorator metadata** | Symbol.metadata interop: read Class[Symbol.metadata], bridge context.metadata to MetadataStore |

---

## API Reference

### Metadata store (key → value)

- **createMetadataStore**(entries?) → MetadataStore — new Map-backed store. Pass another store's `entries()` to snapshot/copy.
- **createMetadataKey**&lt;T&gt;(description?) → TypedMetadataKey&lt;T&gt; — a plain symbol at runtime that carries its value type. `store.get(key)` infers `T | undefined` with no type argument and `store.set(key, value)` rejects wrong-typed values at compile time. Plain `symbol | string` keys keep working exactly as before.
- **globalMetadataStore** — single process-level store, registered under `Symbol.for("@simpill/annotations.utils:global-metadata-store")` on `globalThis` so duplicate copies of this package (npm dedup failures, mixed ESM/CJS graphs) share one store instead of silently splitting state.
- **getMetadata**&lt;T&gt;(key, store?) / **setMetadata**&lt;T&gt;(key, value, store?) — convenience helpers; omit store to use global.
- **MetadataStore**: get, set, has, delete, **getOrSet**(key, factory) (has-based: caches stored `undefined`), **clear**(), **size**, **keys**(), **values**(), **entries**(), and `[Symbol.iterator]` — stores are directly iterable and snapshot-able.

### Per-target annotations (target × key → value)

Attach metadata TO objects — classes, functions, prototypes, instances — the thing the package name promises. WeakMap-backed: annotations are garbage-collected with their targets, keys never collide across targets, and no global is mutated.

- **setAnnotation**(target, key, value) — key is `symbol | string` or a TypedMetadataKey.
- **getAnnotation**&lt;T&gt;(target, key) — own-only read. Allocation-free: reading an un-annotated target never allocates or inserts per-target state.
- **getInheritedAnnotation**&lt;T&gt;(target, key) — walks `Object.getPrototypeOf` until a hit: subclasses see base-class annotations, instances see prototype annotations. Own annotations shadow inherited ones.
- **hasAnnotation** / **hasInheritedAnnotation**(target, key)
- **deleteAnnotation**(target, key) — removing the last annotation releases the target's map so the WeakMap entry can be collected.
- **getAnnotationKeys**(target) / **getAnnotations**(target) — own keys/entries (string and symbol keys included).
- **clearAnnotations**(target) — drop all annotations for target; returns whether any existed.
- **createAnnotationStore**() → AnnotationStore — isolated instance with the same surface for scoped or test-isolated state. The module-level functions share one default backing across duplicate package copies (Symbol.for registry).

### TC39 decorator metadata (Symbol.metadata) interop

TypeScript 5.2+ implements the TC39 Decorator Metadata proposal: standard decorators receive `context.metadata`, and the finished object lands on the class via `Symbol.metadata`, with subclass metadata objects prototype-linked to the parent's. These helpers bridge that standard without reflect-metadata:

- **symbolMetadata**() → symbol — native `Symbol.metadata`, else the `Symbol.for("Symbol.metadata")` polyfill-registry fallback used by TypeScript's emit and Babel.
- **ensureSymbolMetadata**() → symbol — explicit opt-in polyfill install (idempotent, never overwrites native). Importing this package NEVER mutates `Symbol` — `sideEffects: false` is honored.
- **getDecoratorMetadata**(cls) → DecoratorMetadataObject | undefined — own or inherited from a decorated base class.
- **readDecoratorMetadata**&lt;T&gt;(cls, key) — single-key read; inherits per the proposal's prototype-chain semantics.
- **metadataStoreFromDecorator**(context.metadata) → MetadataStore — use the same store API inside decorators. get/has see inherited entries; set/delete/size/iteration are own-only, matching the underlying plain object.

### reflect-metadata interop

This package now covers the common reflect-metadata use case — per-target metadata with inherited lookup — with zero dependencies and no global `Reflect` mutation: `Reflect.defineMetadata/getOwnMetadata/getMetadata` ↔ `setAnnotation/getAnnotation/getInheritedAnnotation`. reflect-metadata remains the right tool if you need `(target, propertyKey, key)` triples or `emitDecoratorMetadata` design-time types; for per-property annotations here, annotate the prototype with a composite or symbol key per property.

### Global store risks

**globalMetadataStore** and the default annotation backing are process-level and unbounded; prefer **createMetadataStore()** / **createAnnotationStore()** for scoped or long-lived use. String keys can collide across libraries sharing the global store — prefer **symbol keys** (`Symbol("myapp:config")` or `createMetadataKey`) or **namespaced strings** (`"myapp:validator"`). For test isolation, pass a scoped store.

### Serialize / snapshot

Stores are iterable: `Array.from(store)`, `new Map(store.entries())`, or `createMetadataStore(store.entries())` for a copy. Per-target: `getAnnotations(target)` returns a plain record.

### Runtime compatibility

No Node-only or DOM APIs; works in Node, browsers, and Edge. Requires Map, WeakMap, Symbol, and globalThis (ES2020).

### What we don't provide

- **(target, propertyKey, key) triples** — reflect-metadata's three-part addressing. Annotate the prototype with per-property composite keys, or use reflect-metadata.
- **Design-time type emission** — `emitDecoratorMetadata`'s `design:type` info is a TypeScript compiler feature, not a library one.

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
