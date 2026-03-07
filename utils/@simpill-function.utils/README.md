## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ffunction.utils.svg)](https://www.npmjs.com/package/@simpill/function.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-function.utils)
</p>

**npm**
```bash
npm install @simpill/function.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-function.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-function.utils` or `npm link` from that directory.

---

## Usage

```ts
import { debounce, throttle, once, pipe, compose } from "@simpill/function.utils";

const save = debounce(doSave, 300);
const onScroll = throttle(handler, 100);
const load = once(fetchConfig);
const transform = pipe(trim, toLower, capitalize);
const transform2 = compose(capitalize, toLower, trim);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Debounce** | Invoke after a wait with no further calls |
| **Throttle** | At most one call per wait period |
| **Once** | Run only the first time |
| **Pipe / Compose** | Left-to-right (pipe) or right-to-left (compose) composition; sync only — use `pipeAsync` from `@simpill/patterns.utils` for async |
| **Arguments** | spreadArgs, fillArgs, requireArgs, firstArg, lastArg, restArgs |
| **Annotations** | setAnnotation, getAnnotation, hasAnnotation, deleteAnnotation, getAnnotations — metadata on any object |
| **noop** | No-op helper |

---

## Import Paths

```ts
import { ... } from "@simpill/function.utils";         // Everything
import { ... } from "@simpill/function.utils/client";  // Client
import { ... } from "@simpill/function.utils/server";  // Server
import { ... } from "@simpill/function.utils/shared";  // Shared only
```

---

## API Reference

- **debounce**(fn, wait) → returns a **CancellableFunction**: same signature plus `.cancel()`, `.flush()`, `.pending()`. No `leading`/`trailing`/`maxWait`; invokes only after `wait` ms of no further calls.
- **throttle**(fn, wait, options?) → **ThrottleOptions**: `leading` (default true), `trailing` (default true). Returns CancellableFunction with `.cancel()`, `.flush()`, `.pending()`.
- **once**(fn) → runs `fn` only on the first call; every subsequent call returns the same cached result. **No reset** — there is no API to “run again”.
- **pipe**(...fns) → composed function (left-to-right: first fn applied first). **Sync only**; for async pipelines use `pipeAsync` from `@simpill/patterns.utils`.
- **compose**(...fns) → composed function (right-to-left). Sync only.
- **pipeWith** / **composeWith** → typed overloads for pipe/compose with distinct input/output types.
- **spreadArgs**(args), **fillArgs**(template, values), **requireArgs**(args, count), **firstArg**/ **lastArg**/ **restArgs**(args, from?) — argument helpers (see below).
- **setAnnotation**(target, key, value), **getAnnotation**(target, key), **hasAnnotation**, **deleteAnnotation**, **getAnnotations** — metadata on objects (validation, DI, plugins).
- **noop**() → no-op function

### This binding

`debounce`, `throttle`, and `once` do not preserve `this`. For methods, wrap: `debounce(() => obj.method(), 100)` or pass a bound function: `debounce(obj.method.bind(obj), 100)`.

### Once behavior

The returned function is idempotent after the first call: same arguments or different, it always returns the first result. Useful for lazy init or single-run setup; not for “run once per session” reset — use your own wrapper if you need reset.

### Arguments helpers

- **spreadArgs**(args) — convert `arguments` or array to a real array.
- **fillArgs**(template, values) — copy template and overwrite by index, e.g. `fillArgs([0, 0], { 1: 2 })` → `[0, 2]`.
- **firstArg**/ **lastArg**/ **restArgs**(args, from?) — first element, last element, or slice from index.

### Annotations use cases

Attach metadata to any object without modifying its prototype: validation schema keys, DI tokens, plugin IDs, or feature flags. Keys are string-based; use a namespace prefix to avoid collisions (e.g. `"myapp:validator"`). Same store is used by `@simpill/annotations.utils` for a richer API.

### What we don’t provide

- **Memoize** — No memoization helper. Use `memoize` / `memoizeAsync` from `@simpill/cache.utils` or `@simpill/misc.utils` for result caching by arguments.
- **Curry / partial** — No `curry` or `partial`. Use `Function.prototype.bind` for partial application, or a library (e.g. lodash) for full curry.
- **Before / after hooks** — No wrapper that runs a function before or after another. Compose manually: `(...args) => { before(); return fn(...args); }` or use a small wrapper with `pipe`/`compose` if you need ordered side effects.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | debounce (cancel/flush), throttle, once, pipe (trim → toLower → capitalize) |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
