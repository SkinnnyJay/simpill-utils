## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ftest.utils.svg)](https://www.npmjs.com/package/@simpill/test.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-test.utils)
</p>

**npm**
```bash
npm install @simpill/test.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-test.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-test.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createTestPatterns,
  createEnricher,
  createFaker,
  createSeededRandom,
  randomInt,
  randomString,
  deferred,
  ref,
  waitMs,
  runAsync,
} from "@simpill/test.utils";

const patterns = createTestPatterns();
const userFixture = patterns.createFixture({ id: 1, name: "Test" });
const enricher = createEnricher({ defaults: { id: 0, name: "Anonymous" } });
const rng = createSeededRandom(42);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **TestPatterns** | createFixture (factory), createDouble/createAsyncDouble (mocks), addTeardown, runTeardown |
| **Enricher** | **createEnricher&lt;T&gt;({ defaults })** for typed defaults; **enrich(partial: Partial&lt;T&gt;)** returns T. |
| **createFaker** | @faker-js/faker wrapper; **FakerWrapperOptions** (seed) typed; pass **seed** for reproducible data. |
| **createSeededRandom** | Deterministic RNG (LCG); use with randomInt/randomString |
| **randomInt** / **randomString** | Require rng from createSeededRandom |
| **deferred** / **ref** / **waitMs** / **runAsync** | Deferred promises, ref cell, waitMs, runAsync for flushing async in tests |
| **DEFAULT_SEED** / **FAKE** | Constants; fake timers/matchers come from Jest/Vitest |

---

## Import Paths

```ts
import { ... } from "@simpill/test.utils";         // Everything
import { ... } from "@simpill/test.utils/client";  // Client
import { ... } from "@simpill/test.utils/server";  // Server
import { ... } from "@simpill/test.utils/shared";  // Shared only
```

---

## API Reference

- **createTestPatterns**() → TestPatterns — **createFixture**(base) (fixture factory), **createDouble**/ **createAsyncDouble** (mocks with `.calls`, `.reset`), **addTeardown**(fn), **runTeardown**() (call in afterEach/afterAll)
- **createEnricher**&lt;T&gt;(options) → Enricher&lt;T&gt; — enrich(enrichMany) with defaults
- **createFaker**(options?) → FakerWrapper — **seed** option for reproducible data; uses `@faker-js/faker` (see package version). Same seed ⇒ same sequence. No built-in matchers or spies — use Jest/Vitest `jest.fn()` / `vi.fn()` for that.
- **createSeededRandom**(seed) → () => number — deterministic RNG (LCG). Pass to **randomInt**(min, max, rng) and **randomString**(length, rng) for reproducible values.
- **deferred**&lt;T&gt;() — { promise, resolve, reject }; **ref**&lt;T&gt;(initial) — { value }; **waitMs**(ms); **runAsync**(fn) — awaits fn() if it returns a promise (e.g. in tests that need to flush microtasks).
- **DEFAULT_SEED**, **FAKE** — constants

### Lifecycle and teardown

Call **addTeardown**(fn) during the test to register cleanup; call **runTeardown**() in `afterEach` or `afterAll` so teardown runs in order. Use with Jest/Vitest lifecycle hooks.

### deferred / runAsync

Use **deferred** when you need to resolve a promise from outside (e.g. simulate an async callback). Use **runAsync**(fn) when the test runner needs to await a sync-or-async function (e.g. `runAsync(() => subject.doSomething())`).

### Deterministic RNG

**createSeededRandom**(seed) returns a function that yields 0–1; use the same seed (e.g. from env or fixed) so test data is reproducible. **randomInt** and **randomString** take this rng as the last argument.

### Fixture factories

**createFixture**(base) returns a function (overrides?) => T that merges overrides onto a copy of base. Use for building test entities with optional overrides per test. **createEnricher** is for “defaults + partial” when you want a single enriched object rather than a reusable factory.

### Fake timers and property-based testing

This package does not provide fake timers — use **Jest** `jest.useFakeTimers()` or **Vitest** `vi.useFakeTimers()`. For property-based testing, use a dedicated library (e.g. fast-check) and optionally feed **createSeededRandom** for reproducibility.

### What we don't provide

- **Fake timers** — Use **Jest** or **Vitest** fake timers; this package does not ship its own.
- **Matcher extensions** — Use **jest.fn()** / **vi.fn()** and the runner’s matchers for mocks and assertions.
- **Property-based testing** — Use **fast-check** (or similar); **createSeededRandom** can feed reproducible data.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createSeededRandom, randomInt, randomString, createTestPatterns, createFixture, createEnricher |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
