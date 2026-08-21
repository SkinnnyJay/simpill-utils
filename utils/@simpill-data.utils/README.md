## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fdata.utils.svg)](https://www.npmjs.com/package/@simpill/data.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-data.utils)
</p>

**npm**
```bash
npm install @simpill/data.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-data.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-data.utils` or `npm link` from that directory.

---

## Usage

```ts
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
| **Validation** | valid, invalid, validateString, validateNumber, validateBoolean, validateRecord, validateArray, validateEnum, refine, mapResult, andThenResult, isString, isNumber, isRecord |
| **Prepare** | withDefaults, coerceNumber, coerceBoolean, coerceString, sanitizeForJson |
| **Config** | mergeConfigLayers, requireKeys, configFromEnv |
| **Lifecycle** | addCreatedAt, touchUpdatedAt, withNextVersion, isNewerVersion |
| **Extend** | deepDefaults, getByPath, setByPath |
| **Utils** | deepClone, pickKeys, omitKeys, ensureKeys |
| **Search** | searchObject, searchString, searchStringAll, StringSearchAlgorithm, ObjectSearchMatch, SearchObjectOptions |

---

## Import Paths

```ts
import { ... } from "@simpill/data.utils";         // Everything
import { ... } from "@simpill/data.utils/client";  // Client
import { ... } from "@simpill/data.utils/server";  // Server
import { ... } from "@simpill/data.utils/shared"; // Shared only
```

---

## API Reference

- **ValidationResult**&lt;T&gt;, **Validator**&lt;T&gt;, **valid**, **invalid**, **validateString**, **validateNumber**, **validateBoolean**, **validateRecord**, **validateArray**, **validateEnum**, **refine**, **mapResult**, **andThenResult**
- **withDefaults**, **coerceNumber**, **coerceBoolean**, **coerceString**, **sanitizeForJson**
- **mergeConfigLayers**, **requireKeys**, **configFromEnv**
- **addCreatedAt**, **touchUpdatedAt**, **withNextVersion**, **isNewerVersion**
- **deepDefaults**, **getByPath**, **setByPath** — **deepDefaults** uses an internal `Record<string, unknown>` implementation; the public API casts at the boundary so callers get **T** back. For custom helpers that merge or extend generics, use the same pattern: cast input to Record for the implementation, cast the result back to **T**.
- **deepClone**, **pickKeys**, **omitKeys**, **ensureKeys**
- **searchObject**(obj, options?) — iteratively walks an object (stack-safe at any depth) and returns matches (path + value). Options: **maxDepth** (default Infinity), **predicate**(path, key, value), **onCycle** (`"skip"` default — circular references are silently skipped; `"throw"` raises). Returns **ObjectSearchMatch[]**. Predicate receives the real property key, including keys containing dots.
- **searchString**(haystack, needle, algorithm?) — returns first index of needle or -1. **StringSearchAlgorithm**: IndexOf, Includes, Kmp.
- **searchStringAll**(haystack, needle, options?) — returns **all** match indices. Options: **overlapping** (default false), **algorithm** (IndexOf default; Kmp available — note native indexOf is faster in practice, KMP is provided for guaranteed O(n+m) worst-case behavior).

### configFromEnv / requireKeys

**configFromEnv**(env, prefix, options?) builds a config object from environment variables. Options: **nestingSeparator** — `"_"` (default, every underscore nests: `APP_DB_HOST` → `{ db: { host } }`) or `"__"` (double-underscore nests, single underscore stays in the key: `APP_API_KEY` → `{ api_key }`, `APP_DB__HOST` → `{ db: { host } }`, matching the .NET/nconf convention); **keyCase** — `"lower"` (default) or `"preserve"`. Hostile segment names (`__proto__`, `constructor`, `prototype`) are skipped. **requireKeys**(obj, keys) throws if any key is missing; keys may be dotted paths (`"db.host"` checks the nested value). A literal top-level key containing a dot is checked first before path traversal.

### deepClone / sanitizeForJson

**deepClone** performs a safe deep copy: circular references and shared sub-objects are preserved (not crashed on, not duplicated), traversal is iterative (no stack overflow at any depth), and Date, RegExp, Map, Set, ArrayBuffer, TypedArrays and DataView are cloned with their types intact. Class instances keep their prototype. Functions and symbols are copied by reference. **sanitizeForJson** guarantees `JSON.stringify` cannot throw on its output: honors `toJSON`, converts Map → plain object and Set → array, bigint → string, NaN/Infinity → null, drops functions/symbols/undefined from objects (null in arrays), and cuts circular references with `"[Circular]"`.

### Schema validation layer (Zod / Joi)

This package does **not** integrate with Zod or Joi. It provides **ValidationResult&lt;T&gt;** and simple validators (**validateString**, **validateNumber**, **validateRecord**). For schema-based validation use **Zod** (or Joi) directly; you can wrap their results in **valid**/**invalid** or use **@simpill/patterns.utils** Result type if you want a unified shape.

### Array and enum validators

**validateArray**(value, elementValidator?) validates arrays, optionally running a validator against each element and reporting the failing index in the message. **validateEnum**(value, allowed) validates membership against a readonly tuple and narrows to the literal union when called with `as const`:

```ts
const status = validateEnum(input, ["draft", "live"] as const);
// status: ValidationResult<"draft" | "live">
const ports = validateArray(input, refine(validateNumber, (n) => n > 0, "Expected positive"));
```

### Validation errors

**ValidationResult** is **{ ok: true, value: T } | { ok: false, message: string }**. There are **no** rich validation errors (e.g. field paths, multiple issues). Use the **message** string for logging or user feedback; for structured errors use Zod’s **.safeParse** or **.flatten()** and map to your API shape.

### Refine / composition helpers

**refine**(validator, predicate, message) wraps a validator with an extra predicate. **mapResult**(result, fn) transforms the value of a valid result. **andThenResult**(result, fn) chains a result into another validation. All are plain functions over **ValidationResult** — no schema layer required:

```ts
const validatePort = refine(validateNumber, (n) => n > 0 && n < 65536, "Expected port");
const parsed = andThenResult(validateString(raw), (s) => validatePort(Number(s)));
```

### Merge strategy (config layers)

**mergeConfigLayers(layers)** merges from left to right: each layer is **deep-merged** into the previous result. For each key, if both sides are plain objects (not arrays), they are recursively merged; otherwise the **right-hand value wins**. There is **no** option for “replace entire key” or “concat arrays”; for different strategies, merge layers in a custom order or preprocess layers before passing them in.

### Delete / update by path

**getByPath** and **setByPath** are re-exported from **@simpill/object.utils**. Use **object.utils** for path-only access; use **data.utils** when you need **deepDefaults** or config (mergeConfigLayers, configFromEnv). There is **no** **deleteByPath** or **updateByPath**. To delete a key, use **getByPath** to reach the parent object and delete the key yourself, or implement a small helper that splits the path and mutates the parent. **setByPath** can “update” by setting a new value at a path.

### What we don't provide

- **Zod/Joi integration** — No schema layer; use **ValidationResult** and simple validators, or Zod/Joi directly and wrap with **valid**/**invalid** if needed.
- **Rich validation errors** — Only **message** string on invalid (element index included for **validateArray**); for field paths or multiple issues use Zod’s **.flatten()** or similar.
- **deleteByPath / updateByPath** — Use **getByPath** to parent and delete the key, or **setByPath** for updates.
- **Merge strategy options** — **mergeConfigLayers** uses right-wins deep merge; for “replace key” or “concat arrays” preprocess layers or merge in custom order.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Simple runtime checks (string, number, boolean, record, array, enum) | Use **validateString** / **validateNumber** / **validateBoolean** / **validateRecord** / **validateArray** / **validateEnum**; compose with **refine** / **mapResult** / **andThenResult**. |
| Layered config (defaults + env) | Use **mergeConfigLayers** and **configFromEnv**; **requireKeys** for startup checks. |
| Lifecycle timestamps / versions | Use **addCreatedAt**, **touchUpdatedAt**, **withNextVersion**, **isNewerVersion**. |
| Nested path read/write | Use **getByPath** / **setByPath** (no delete helper). |
| Full schema validation | Use **Zod** (or Joi) and optionally wrap with this package’s result type. |
| Search in objects/strings | Use **searchObject** (cycle-safe, any depth) / **searchString** / **searchStringAll**. |

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | validate, withDefaults, mergeConfigLayers, lifecycle (addCreatedAt, touchUpdatedAt), searchObject/searchString |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
