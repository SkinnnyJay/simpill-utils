<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/object.utils" width="100%" />
</p>

<p align="center">
  <strong>Type-safe object utilities: pick, omit, merge, get/set by path, guards</strong>
</p>

<p align="center">
  Type-safe pick, omit, merge, and get/set by path—no <code>any</code>, full inference.
</p>

**Features:** Type-safe · Node.js & Edge · Tree-shakeable · Lightweight

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-summary">API Summary</a> •
  <a href="#examples">Examples</a> •
  <a href="#development">Development</a>
</p>

---

## Installation

```bash
npm install @simpill/object.utils
```

## Usage

### Subpath exports

```ts
import { pick, omit, deepMerge, isPlainObject } from "@simpill/object.utils";
// or client/edge only
import { pick, deepFreeze } from "@simpill/object.utils/client";
// or server only
import { pick, deepFreeze } from "@simpill/object.utils/server";
// or shared only
import { pick, deepFreeze } from "@simpill/object.utils/shared";
```

### Type utilities (type-only)

Use in type positions for safer object shapes:

```ts
import type {
  PartialBy,
  RequiredBy,
  DeepPartial,
  DeepRequired,
  ValueOf,
  KeysOfType,
  StrictRecord,
} from "@simpill/object.utils";

type User = { id: number; name: string; email?: string };
type CreateUser = PartialBy<User, "id">;  // id optional
type WithEmail = RequiredBy<User, "email">;
type PatchUser = DeepPartial<User>;
```

### Guards

```ts
import {
  isPlainObject,
  isObject,
  isRecord,
  isEmptyObject,
  hasOwn,
  isNil,
  isDefined,
} from "@simpill/object.utils";

isPlainObject({});       // true
isPlainObject([]);      // false
isEmptyObject({});      // true
hasOwn({ a: 1 }, "a");  // true
isDefined(null);        // false
```

### Get/Set by path

```ts
import { getByPath, getByPathOrDefault, hasPath, setByPath } from "@simpill/object.utils";

const obj = { a: { b: { c: 1 } } };
getByPath(obj, "a.b.c");           // 1 (returns unknown; assert or narrow when you know the shape)
getByPath(obj, "");                // obj (empty path returns the object unchanged)
getByPathOrDefault(obj, "a.x", 0); // 0
hasPath(obj, "a.b");               // true
setByPath(obj, "a.b.d", 2);        // mutates obj
```

There is no **deleteByPath**. To remove a key at a path, use **getByPath(obj, parentPath)** to get the parent object, then `delete parent[key]` for the last segment, or implement a small helper that splits the path and mutates the parent.

**Singleton:** `createSingleton(factory, key)` stores instances on **globalThis** (one map per process). For process isolation this is fine; in tests call **resetSingleton(key)** or **resetAllSingletons()** to avoid leaking state between tests.

### Pick / Omit

```ts
import { pick, omit, pickOne } from "@simpill/object.utils";

const user = { id: 1, name: "Alice", email: "a@b.com" };
pick(user, ["id", "name"]);  // { id: 1, name: "Alice" }
omit(user, ["email"]);       // { id: 1, name: "Alice" }
pickOne(user, "name");       // { name: "Alice" }
```

### Merge

```ts
import { shallowMerge, deepMerge } from "@simpill/object.utils";

shallowMerge({ a: 1, b: 2 }, { b: 3, c: 4 }); // { a: 1, b: 3, c: 4 }

deepMerge(
  { a: { b: 1, c: 2 } },
  { a: { c: 3, d: 4 } },
  { concatArrays: true, skipUndefined: true }
);
// { a: { b: 1, c: 3, d: 4 } }
```

**deepMerge options** (`DeepMergeOptions`):

| Option | Default | Description |
|--------|---------|-------------|
| `concatArrays` | `false` | If `true`, array values are concatenated (target then source); otherwise source array overwrites target. |
| `skipUndefined` | `false` | If `true`, `undefined` in source does not overwrite existing target values. |

Deep merge only recurses into plain objects; other values (including arrays when not concatenating) are taken from source. Target is never mutated; a new object is returned. **No cycle detection**—do not pass objects with circular references or recursion may not terminate.

### Immutable helpers

```ts
import { deepFreeze, deepSeal } from "@simpill/object.utils";

const state = deepFreeze({ user: { name: "Alice" } });
// state.user.name = "Bob"; // throws in strict mode
```

### Create / define

```ts
import {
  createWithDefaults,
  defineReadOnly,
  fromEntries,
} from "@simpill/object.utils";

createWithDefaults({ a: 1, b: 2 }, { b: 3 }); // { a: 1, b: 3 }

const obj: Record<string, number> = {};
defineReadOnly(obj, "id", 42); // non-enumerable, read-only

fromEntries([["x", 1], ["y", 2]]); // { x: 1, y: 2 }
```

**Safe JSON stringify:** This package does not provide a safe stringify helper. For "stringify or fallback" use `toJsonSafe` from `@simpill/misc.utils`, or `JSON.stringify` in a try/catch.

### Singleton

Single instance per key (uses `globalThis`; works with Next.js hot reload):

```ts
import { createSingleton, resetSingleton, resetAllSingletons } from "@simpill/object.utils";

const getCache = createSingleton(() => new Map<string, number>(), "my-cache");
const cache = getCache(); // same instance every time

// tests
resetSingleton("my-cache");
resetAllSingletons();
```

### Bounded collections

**BoundedLRUMap** – size-limited Map with LRU eviction; optional logger for alerts:

```ts
import { BoundedLRUMap } from "@simpill/object.utils";

const cache = new BoundedLRUMap<string, number>(1000);
cache.set("k", 42);
cache.get("k"); // 42
// when full, oldest entry is evicted

// with optional logger (e.g. your app logger)
const withLogger = new BoundedLRUMap<string, number>({
  maxSize: 100,
  alertThreshold: 0.8,
  logger: { warn: (msg, meta) => console.warn(msg, meta) },
});
```

**LRU behavior and complexity:** `get` and `set` are O(1). On `set`, if the key already exists it is moved to "most recent"; if the map is full, the least-recently-used entry (oldest insertion/access order) is evicted. Eviction count is tracked and available via `getStats()`. For TTL-based caches or memoization, see `@simpill/cache.utils`.

**BoundedArray** – size-limited array with FIFO eviction; optional logger:

```ts
import { BoundedArray } from "@simpill/object.utils";

const buffer = new BoundedArray<string>(100);
buffer.push("a");
buffer.push("b");
// when over maxSize, oldest items are dropped
buffer.getStats(); // { size, maxSize, usagePercent, evictions }
```

**BoundedArray eviction:** When length exceeds `maxSize`, the oldest items (front of the array) are dropped. `getStats()` reports `evictions` and `usagePercent`.

### What we don’t provide

- **Typed path helpers** — `getByPath` returns `unknown`; narrow with a type guard or generic wrapper at call site (e.g. `getByPath(obj, "a.b") as number` or Zod parse). `setByPath` mutates. For type-safe paths, use a dedicated library or wrap with your own path tuple/union.
- **Deep equal / deep clone** — No `deepEqual` or `deepClone`. Use `deepClone` from `@simpill/data.utils`, or lodash `isEqual` / `cloneDeep`. This package provides `deepMerge` (merge only) and `deepFreeze` / `deepSeal`.
- **Diff / patch** — No structural diff or JSON Patch. Use a library (e.g. `fast-json-patch`, lodash) if you need diff/patch.
- **Immutable “update by path”** — `setByPath` mutates. For immutable updates, clone first (e.g. `deepClone` from `@simpill/data.utils`) then `setByPath` on the clone, or use spread/Immer.
- **Shape guards** — We provide `isPlainObject`, `isRecord`, `isEmptyObject`, `hasOwn`, etc. For “object has keys `a` and `b`” use Zod (or similar) or manual `hasOwn` checks.

**When to use:** Pick/omit, path get/set, shallow/deep merge, type utilities, guards, singletons, and bounded in-memory structures. For full validation, deep clone, or diff/patch, combine with `@simpill/data.utils` or other libs.

## API summary

| Category    | Exports |
|------------|---------|
| Types      | `PartialBy`, `RequiredBy`, `DeepPartial`, `DeepRequired`, `ValueOf`, `Entries`, `KeysOfType`, `StrictRecord`, `Mutable`, `DeepReadonly`, etc. |
| Guards     | `isPlainObject`, `isObject`, `isRecord`, `isEmptyObject`, `hasOwn`, `isNil`, `isDefined` |
| Path       | `getByPath`, `getByPathOrDefault`, `hasPath`, `setByPath` |
| Pick/Omit  | `pick`, `omit`, `pickOne` |
| Merge      | `shallowMerge`, `deepMerge` (with `DeepMergeOptions`) |
| Immutable  | `deepFreeze`, `deepSeal` |
| Create     | `createWithDefaults`, `defineReadOnly`, `fromEntries` |
| Singleton  | `createSingleton`, `resetSingleton`, `resetAllSingletons` |
| Bounded    | `BoundedLRUMap`, `BoundedArray` (optional `logger` in options) |

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | pick, omit, getByPath, getByPathOrDefault, setByPath, deepMerge, isPlainObject |

---

## Development

```bash
npm run build
npm test
npm run test:coverage
npm run check:fix
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/@simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/@simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

## License

ISC
