<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/data.utils" width="100%" />
</p>

<p align="center">
  <strong>Data utilities: validate, prepare, lifecycle, extend, config</strong>
</p>

<p align="center">
  Data utilities: validate, prepare, lifecycle, extend, config.
</p>

**Features:** Type-safe · Node & Edge · Tree-shakeable. The API groups helpers under a **dot prefix** (e.g. `data.extend`, `data.validate`, `data.prepare`, `data.lifecycle`); import the functions you need from the main entry or `/shared`.

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
npm install @simpill/data.utils
```

---

## Quick Start

```typescript
import {
  valid,
  invalid,
  validateNumber,
  withDefaults,
  mergeConfigLayers,
  deepClone,
  addCreatedAt,
  touchUpdatedAt,
} from "@simpill/data.utils";

const r = validateNumber(42);
const full = withDefaults({ a: 1 }, { b: 2 });
const merged = mergeConfigLayers([{ port: 3000 }, { host: "localhost" }]);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Validation** | valid, invalid, validateString, validateNumber, validateRecord, isString, isNumber, isRecord |
| **Prepare** | withDefaults, coerceNumber, coerceBoolean, coerceString, sanitizeForJson |
| **Config** | mergeConfigLayers, requireKeys, configFromEnv |
| **Lifecycle** | addCreatedAt, touchUpdatedAt, withNextVersion, isNewerVersion |
| **Extend** | deepDefaults, getByPath, setByPath |
| **Utils** | deepClone, pickKeys, omitKeys, ensureKeys |
| **Search** | searchObject, searchString, StringSearchAlgorithm, ObjectSearchMatch, SearchObjectOptions |

---

## Import Paths

```typescript
import { ... } from "@simpill/data.utils";         // Everything
import { ... } from "@simpill/data.utils/client";  // Client
import { ... } from "@simpill/data.utils/server";  // Server
import { ... } from "@simpill/data.utils/shared"; // Shared only
```

---

## API Reference

- **ValidationResult**&lt;T&gt;, **valid**, **invalid**, **validateString**, **validateNumber**, **validateRecord**
- **withDefaults**, **coerceNumber**, **coerceBoolean**, **coerceString**, **sanitizeForJson**
- **mergeConfigLayers**, **requireKeys**, **configFromEnv**
- **addCreatedAt**, **touchUpdatedAt**, **withNextVersion**, **isNewerVersion**
- **deepDefaults**, **getByPath**, **setByPath**
- **deepClone**, **pickKeys**, **omitKeys**, **ensureKeys**
- **searchObject**(obj, options?) — walks object and returns matches (path + value). Options: **maxDepth** (default Infinity; set to limit traversal depth for large or deep trees), **predicate**(path, value). Returns **ObjectSearchMatch[]**.
- **searchString**(haystack, needle, algorithm?) — returns first index of needle or -1. **StringSearchAlgorithm**: IndexOf, Includes, Kmp.

### configFromEnv / requireKeys

**configFromEnv** builds a config object from environment variables (key mapping and optional coercion). **requireKeys**(obj, keys) throws if any of the given keys are missing from the object — use for startup validation of required config. Check package source or tests for exact signatures and error shape.

### deepClone / sanitizeForJson

**deepClone** performs a deep copy; behavior with circular references, non-JSON values (Date, Map, Set), or functions is implementation-dependent — validate for your use case. **sanitizeForJson** prepares values for JSON serialization; see implementation for how non-serializable or circular values are handled.

### Schema validation layer (Zod / Joi)

This package does **not** integrate with Zod or Joi. It provides **ValidationResult&lt;T&gt;** and simple validators (**validateString**, **validateNumber**, **validateRecord**). For schema-based validation use **Zod** (or Joi) directly; you can wrap their results in **valid**/**invalid** or use **@simpill/patterns.utils** Result type if you want a unified shape.

### Array and enum validators

There are **no** dedicated **validateArray** or **validateEnum** helpers. For arrays, use **validateRecord** on objects or implement a small predicate (e.g. **Array.isArray** + element checks). For enums, use a record check or a Zod enum. The package stays minimal; combine with your schema lib as needed.

### Validation errors

**ValidationResult** is **{ ok: true, value: T } | { ok: false, message: string }**. There are **no** rich validation errors (e.g. field paths, multiple issues). Use the **message** string for logging or user feedback; for structured errors use Zod’s **.safeParse** or **.flatten()** and map to your API shape.

### Refine / composition helpers

There are **no** built-in **refine** or **compose** helpers for validators. Chain validations manually (e.g. validateString then check format) or use Zod’s **.refine()** / **.transform()**. This package focuses on simple predicates and result wrappers.

### Merge strategy (config layers)

**mergeConfigLayers(layers)** merges from left to right: each layer is **deep-merged** into the previous result. For each key, if both sides are plain objects (not arrays), they are recursively merged; otherwise the **right-hand value wins**. There is **no** option for “replace entire key” or “concat arrays”; for different strategies, merge layers in a custom order or preprocess layers before passing them in.

### Delete / update by path

**getByPath** and **setByPath** are re-exported from **@simpill/object.utils**. Use **object.utils** for path-only access; use **data.utils** when you need **deepDefaults** or config (mergeConfigLayers, configFromEnv). There is **no** **deleteByPath** or **updateByPath**. To delete a key, use **getByPath** to reach the parent object and delete the key yourself, or implement a small helper that splits the path and mutates the parent. **setByPath** can “update” by setting a new value at a path.

### What we don't provide

- **Zod/Joi integration** — No schema layer; use **ValidationResult** and simple validators, or Zod/Joi directly and wrap with **valid**/**invalid** if needed.
- **validateArray / validateEnum** — Use **validateRecord** or custom predicates; for enums use a record or Zod enum.
- **Rich validation errors** — Only **message** string on invalid; for field paths or multiple issues use Zod’s **.flatten()** or similar.
- **refine / compose** — Chain validations manually or use Zod’s **.refine()** / **.transform()**.
- **deleteByPath / updateByPath** — Use **getByPath** to parent and delete the key, or **setByPath** for updates.
- **Merge strategy options** — **mergeConfigLayers** uses right-wins deep merge; for “replace key” or “concat arrays” preprocess layers or merge in custom order.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Simple runtime checks (string, number, record) | Use **validateString** / **validateNumber** / **validateRecord** and **valid** / **invalid**. |
| Layered config (defaults + env) | Use **mergeConfigLayers** and **configFromEnv**; **requireKeys** for startup checks. |
| Lifecycle timestamps / versions | Use **addCreatedAt**, **touchUpdatedAt**, **withNextVersion**, **isNewerVersion**. |
| Nested path read/write | Use **getByPath** / **setByPath** (no delete helper). |
| Full schema validation | Use **Zod** (or Joi) and optionally wrap with this package’s result type. |
| Search in objects/strings | Use **searchObject** / **searchString** with optional algorithm. |

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | validate, withDefaults, mergeConfigLayers, lifecycle (addCreatedAt, touchUpdatedAt), searchObject/searchString |

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
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/@simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/@simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
