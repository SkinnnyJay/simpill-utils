<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/async.utils" width="100%" />
</p>

<p align="center">
  <strong>Async utilities: raceWithTimeout, retry, delay, Semaphore, parallelMap</strong>
</p>

<p align="center">
  Retry failed promises with timeout, delay, and backoff; limit concurrency with Semaphore.
</p>

**Features:** Type-safe · Node & Edge · Lightweight · Tree-shakeable

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

**When to use:** You need `delay`, `retry` with backoff, `raceWithTimeout`, concurrency limits (pool, Semaphore, Mutex), async composition (`mapAsync`), or polling. All exports are runtime-agnostic (no Node-only APIs in shared code); use client/server subpaths only if you split bundles.

---

## Installation

```bash
npm install @simpill/async.utils
```

---

## Quick Start

```typescript
import { delay, raceWithTimeout, retry } from "@simpill/async.utils";

const data = await raceWithTimeout(fetch(url), 5000);
await delay(100);
const result = await retry(() => fetch(url), {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
});
```

---

## Features

| Feature | Description |
|---------|-------------|
| **delay** | Resolve after a given number of milliseconds |
| **retry** | Retry an async function with backoff and onRetry hook |
| **raceWithTimeout** | Race a promise against a timeout |
| **Parallel** | parallelMap, parallelRun, pool for concurrency control |
| **limit** | createLimit, limitFunction for bounded concurrency |
| **deferred** | createDeferred for deferred promises |
| **time** | timeAsync, timePromise for timing |
| **reflect** | reflect for settled results |
| **timeoutResult** | timeoutResult for non-throwing timeouts |
| **timeoutResultToResult** | timeoutResultToResult for result-style timeouts |
| **any/some** | anyFulfilled, someFulfilled for promise selection |
| **series** | series, mapSeries for serial execution |
| **all** | allWithLimit for thunk batches |
| **props** | promiseProps for object resolution |
| **filter/reduce** | filterAsync, reduceAsync for async collections |
| **map** | mapAsync with optional concurrency |
| **timeout** | timeoutWithFallback for soft timeouts |
| **queue** | createQueue for async task queueing |
| **gates** | composeGates, withLimit for gated execution |
| **Semaphore / Mutex** | Concurrency primitives |
| **PollingManager** | Configurable polling with backoff |

---

## Import Paths

```typescript
import { ... } from "@simpill/async.utils";         // Everything
import { ... } from "@simpill/async.utils/client";  // Client
import { ... } from "@simpill/async.utils/server";  // Server
import { ... } from "@simpill/async.utils/shared";  // Shared only
```

---

## API Reference

- **delay**(ms) → Promise&lt;void&gt;
- **retry**(fn, options?) → Promise&lt;T&gt; — options: maxAttempts, delayMs, backoffMultiplier, onRetry (no built-in jitter; add in onRetry if needed)
- **raceWithTimeout**(promise, ms, timeoutError?) → Promise&lt;T&gt; — **rejects** if timeout wins; use **timeoutWithFallback**(promise, ms, fallback) when you want a fallback value instead of throwing
- **parallelMap**, **parallelRun**, **pool** — concurrency helpers
- **createLimit**, **limitFunction**, **LimitOptions** — concurrency limiter
- **createDeferred**, **Deferred** — deferred promise helper
- **timeAsync**, **timePromise** — measure async execution
- **reflect**, **Reflected** — reflect fulfilled/rejected
- **timeoutResult**, **TimeoutResult** — timeout without throwing
- **timeoutResultToResult**, **TimeoutResultToResultOptions** — timeout results mapped to Result
- **anyFulfilled**, **someFulfilled** — select fulfilled promises
- **series**, **mapSeries** — run in series
- **allWithLimit**, **AllOptions** — run thunks with optional limit
- **promiseProps** — resolve object values
- **filterAsync**, **reduceAsync** — async collection helpers
- **mapAsync**, **MapOptions** — async map with optional `concurrency` and `signal` (AbortSignal); **preserves input order** in the result array
- **timeoutWithFallback**(promise, ms, fallback) — resolves with `fallback` if timeout wins; does not cancel the original promise
- **composeGates**, **withLimit**, **Semaphore**, **Mutex** — concurrency primitives
- **PollingManager** — polling with backoff; options: initialIntervalMs, maxIntervalMs, backoffFactor, maxAttempts (zod-validated). Optional **pollTimeoutMs** per poll so a hung pollFn does not block the next run (onError + schedule next). start()/stop(); optional stopCondition, onError, onSuccess.
- **createQueue**, **QueueOptions**, **Queue** — async task queue; use options to set concurrency. Up to `concurrency` tasks run at once; starting each task schedules a microtask, so a large queue drains in batches of concurrency-sized runs.

### What we don’t provide

- **AbortSignal everywhere** — Only **mapAsync** accepts an optional `signal`; `retry`, `delay`, `raceWithTimeout`, and the queue/pool APIs do not. To cancel retries or timeouts, use `Promise.race` with a promise that rejects when your `AbortController` aborts, or implement early exit inside `onRetry`.
- **Retry classification / jitter** — Retry does not classify errors (e.g. “retry only on 5xx”). Use `onRetry` to decide whether to continue or rethrow. There is no built-in jitter; add random delay in `onRetry` (e.g. `delay(delayMs * (0.5 + Math.random()))`) if needed.
- **Queue/pool cancellation** — Queues and pools do not accept `AbortSignal`. Drain the queue or stop submitting work and wait for in-flight tasks to finish; there is no “cancel all” API.
- **Finalize hooks** — No try/finally-style hook on retry or timeouts. Wrap calls in your own `try/finally` for cleanup.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | delay, retry, raceWithTimeout |

### Bounded concurrency

Use **createLimit**(n) or **mapAsync**(items, mapper, { concurrency: n }) to cap concurrent work. Example:

```typescript
import { mapAsync, createLimit } from "@simpill/async.utils";

const urls = ["https://a.com", "https://b.com", "https://c.com"];
const bodies = await mapAsync(urls, (url) => fetch(url).then((r) => r.text()), { concurrency: 2 });
// At most 2 fetches in flight; result order matches urls.
```

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
