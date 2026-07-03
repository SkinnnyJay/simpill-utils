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
| **TestPatterns** | createFixture (factory, deep-isolated builds, object or ({ sequence }) => T bases), createDouble/createAsyncDouble (mocks), addTeardown, runTeardown (LIFO, runs all, aggregates errors) |
| **Enricher** | **createEnricher&lt;T&gt;({ defaults })** for typed defaults; **enrich(partial: Partial&lt;T&gt;)** returns T with per-call deep-cloned defaults. |
| **createFaker** | @faker-js/faker wrapper with per-instance seed isolation; defaults to **DEFAULT_SEED**; pass **seed** for a specific stream. |
| **createSeededRandom** | Deterministic RNG (mulberry32, full 2^32 period, values in [0, 1)) |
| **randomInt** / **randomString** | Require rng from createSeededRandom; validated bounds; optional custom alphabet |
| **waitUntil** | Poll a sync/async condition until truthy (timeout, interval, AbortSignal) — the eventually/waitFor primitive |
| **deferred** / **ref** / **waitMs** / **runAsync** | Deferred promises with readable state, ref cell, waitMs with signal/unref, runAsync awaits any thenable |
| **DEFAULT_SEED** / **DEFAULT_ALPHABET** / **FAKE** | Constants; fake timers/matchers come from Jest/Vitest |

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

- **createTestPatterns**() → TestPatterns — **createFixture**(base | ({ sequence }) => T) (fixture factory; every build deep-clones plain data so fixtures never share nested state), **createDouble**/ **createAsyncDouble** (mocks with `.calls`, `.reset`), **addTeardown**(fn), **runTeardown**() (LIFO; runs every teardown even if some throw, then rethrows — multiple failures as AggregateError)
- **createEnricher**&lt;T&gt;(options) → Enricher&lt;T&gt; — enrich(enrichMany) with defaults; nested defaults are deep-cloned per call so results never alias each other
- **createFaker**(options?) → FakerWrapper — **seed** option for a specific stream (defaults to **DEFAULT_SEED**, so data is reproducible by default). Each wrapper gets its own isolated faker instance — constructing or seeding one wrapper never affects another. Same seed ⇒ same sequence. No built-in matchers or spies — use Jest/Vitest `jest.fn()` / `vi.fn()` for that.
- **createSeededRandom**(seed) → () => number — deterministic RNG (mulberry32; full 2^32 period; identical sequences on every JS engine; values in [0, 1), upper bound exclusive). Accepts any finite seed. Pass to **randomInt**(min, max, rng) and **randomString**(length, rng, alphabet?) for reproducible values.
- **waitUntil**(condition, { timeoutMs, intervalMs, signal, message }?) — polls a sync/async condition until it returns a truthy value and resolves with it; throwing conditions are retried; rejects with **WaitUntilTimeoutError** (carrying `lastError`) on deadline.
- **deferred**&lt;T&gt;() — { promise, resolve, reject, state } (state: "pending" | "fulfilled" | "rejected"); **ref**&lt;T&gt;(initial) — { value }; **waitMs**(ms, { signal, unref }?); **runAsync**(fn) — awaits fn()'s result, including custom thenables.
- **DEFAULT_SEED**, **DEFAULT_ALPHABET**, **FAKE** — constants

### Lifecycle and teardown

Call **addTeardown**(fn) during the test to register cleanup; call **runTeardown**() in `afterEach` or `afterAll`. Teardowns run in REVERSE registration order (LIFO) — the standard unwind order (vitest `onTestFinished`, Go `defer`): resources registered later typically depend on earlier ones. Every teardown runs even if some throw; failures rethrow afterwards (multiple as AggregateError).

### deferred / runAsync

Use **deferred** when you need to resolve a promise from outside (e.g. simulate an async callback). Use **runAsync**(fn) when the test runner needs to await a sync-or-async function (e.g. `runAsync(() => subject.doSomething())`).

### Deterministic RNG

**createSeededRandom**(seed) returns a function that yields values in [0, 1) — never exactly 1 — with a full 2^32 period (mulberry32 with exact 32-bit arithmetic, so sequences match across engines). Use the same seed (e.g. from env or fixed) so test data is reproducible; any finite seed works, and nearby seeds produce unrelated streams. **randomInt** and **randomString** take this rng as an argument; **randomString** accepts an optional custom alphabet.

### Fixture factories

**createFixture**(base) returns a function (overrides?) => T that merges overrides onto a fresh deep clone of base — fixtures never share nested objects with the base or each other, so mutating one test's fixture cannot corrupt another's. base can also be a function ({ sequence }) => T for dynamic per-build defaults (sequence starts at 1). Override values are kept by reference. **createEnricher** is for “defaults + partial” when you want a single enriched object rather than a reusable factory.

### Fake timers and property-based testing

This package does not provide fake timers — use **Jest** `jest.useFakeTimers()` or **Vitest** `vi.useFakeTimers()`. For property-based testing, use a dedicated library (e.g. fast-check) and optionally feed **createSeededRandom** for reproducibility.

### What we don't provide

- **Fake timers** — Use **Jest** or **Vitest** fake timers; this package does not ship its own.
- **Matcher extensions** — Use **jest.fn()** / **vi.fn()** and the runner’s matchers for mocks and assertions.
- **Property-based testing** — Use **fast-check** (or similar); **createSeededRandom** can feed reproducible data.

### waitUntil

Use **waitUntil**(() => condition) when a test must wait for eventual state (a server accepting connections, a file appearing, an emitted flag) instead of sleeping a fixed time. It polls every `intervalMs` (default 10) until truthy or `timeoutMs` (default 1000), supports async conditions and AbortSignal, retries throwing conditions, and reports the last error in the timeout failure.

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
