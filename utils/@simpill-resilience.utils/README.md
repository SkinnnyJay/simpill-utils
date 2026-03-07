## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fresilience.utils.svg)](https://www.npmjs.com/package/@simpill/resilience.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-resilience.utils)
</p>

**npm**
```bash
npm install @simpill/resilience.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-resilience.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-resilience.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  CircuitBreaker,
  RateLimiter,
  createBulkhead,
  withJitter,
} from "@simpill/resilience.utils";

const cb = new CircuitBreaker({ failureThreshold: 5, openMs: 60000 });
const result = await cb.run(() => fetchSomething());

const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
await limiter.run(() => callApi());

const bulkhead = createBulkhead(5);
await bulkhead.run(() => doWork());

const delayMs = withJitter(1000, { factor: 0.2, maxMs: 2000 });
```

## API

- **CircuitBreaker(options)** — run(fn), getState(): 'closed' | 'open' | 'half-open'; options: failureThreshold, successThreshold, openMs, halfOpenMaxCalls, **onStateChange(state, previousState)**
- **RateLimiter(options)** — run(fn), fixed-window rate limit
- **createBulkhead(limit)** — returns { run(fn) }, limits concurrent executions
- **withJitter(ms, options?)** — returns jittered ms; options: factor, maxMs
- **retryResult(fn, options?)** — retries fn via @simpill/async.utils retry; returns **Result&lt;T, AppError&gt;** (Ok/Err) with optional **mapError**

### Circuit breaker: metrics and events

Use optional **onStateChange(state, previousState)** in the constructor to observe state transitions (e.g. for metrics or logging). **getState()** returns the current state (`'closed' | 'open' | 'half-open'`). For production metrics, call **onStateChange** from your monitoring integration.

### Bulkhead: queueing

**createBulkhead(limit)** uses a **Semaphore** from @simpill/async.utils. There is **no separate queue**: callers that call **run(fn)** wait until a slot is free, then **fn** runs. Concurrency is limited to **limit**; extra calls block (await) until a slot opens. No configurable queue size or reject-overflow behavior.

### Token bucket / leaky bucket

Only a **fixed-window** rate limiter is provided (**RateLimiter**). For **token bucket** or **leaky bucket** algorithms use another library or implement on top of **withJitter** and your own state.

### Redis rate limiting

**RateLimiter** is **in-memory** only (single process). For distributed or Redis-backed rate limiting use a dedicated solution (e.g. Redis sliding window or token bucket).

### Timeout wrapper

This package does **not** provide a timeout wrapper. Use **@simpill/async.utils** **raceWithTimeout** or **@simpill/http.utils** **fetchWithTimeout** to add timeouts. You can combine: e.g. **circuitBreaker.run(() => fetchWithTimeout(...))**.

### Per-call overrides

CircuitBreaker, RateLimiter, and Bulkhead have **no per-call overrides** (e.g. different limits per request). Options are set at construction. Use **separate instances** (e.g. one breaker per backend, or one limiter per tenant) if you need different settings.

### Error counting (circuit breaker)

**CircuitBreaker** treats **any** thrown error from **run(fn)** as a **failure**: it calls **recordFailure()** in the catch path. Success is when **fn** resolves without throwing. There is no option to classify errors (e.g. retryable vs non-retryable); wrap **fn** to throw only for failures you want to count if needed.

### retryResult

**retryResult(fn, options)** runs **fn** with **@simpill/async.utils** **retry** and returns **Result&lt;T, AppError&gt;** from @simpill/patterns.utils: **ok(value)** on success, **err(appError)** on final failure. **options** extend **RetryOptions** (maxAttempts, delayMs, backoffMultiplier, onRetry, etc.) and add **mapError?: (error: unknown) => AppError** to turn the last thrown error into an **AppError** (default: wrap non-AppError in AppError with **ERROR_CODES.INTERNAL**).

### Composing with http.utils

Use **@simpill/http.utils** for timeout and retry on fetch; use this package for **circuit breaking** or **rate limiting** around those calls. Example: wrap the HTTP call in the breaker so repeated failures open the circuit:

```ts
import { CircuitBreaker } from "@simpill/resilience.utils";
import { createHttpClient } from "@simpill/http.utils";

const cb = new CircuitBreaker({ failureThreshold: 5, openMs: 60_000 });
const client = createHttpClient({ baseUrl: "https://api.example.com" });

const res = await cb.run(() => client.get("/users"));
```

Or pass a **custom fetch** to createHttpClient that runs through the breaker. RateLimiter and createBulkhead can wrap the same way to limit how many requests run per window or concurrently.

### Tuning guidance

| Component | Options | Guidance |
|-----------|---------|----------|
| **CircuitBreaker** | failureThreshold, successThreshold, openMs, halfOpenMaxCalls | Start with failureThreshold 5–10, openMs 30–60s; halfOpenMaxCalls 1–3 to test recovery. |
| **RateLimiter** | maxRequests, windowMs | Match downstream limits (e.g. API 100/min → maxRequests 100, windowMs 60_000). Fixed window can allow bursts at boundary. |
| **createBulkhead** | limit | Set to max concurrent calls the backend can handle; too low increases latency, too high can overload. |
| **withJitter** | factor, maxMs | factor 0.2–0.3 and maxMs cap avoid thundering herd; use in retry delayMs. |

### What we don't provide

- **Circuit breaker metrics / events** — No callbacks or metrics; poll **getState()** or wrap **run()** to observe.
- **Bulkhead queue** — Callers **await** until a slot is free; no separate queue or reject-overflow option.
- **Token bucket / leaky bucket** — Only fixed-window **RateLimiter**; use another library for other algorithms.
- **Redis / distributed rate limiting** — In-memory only; use a dedicated solution for multi-process or Redis.
- **Timeout wrapper** — Use **@simpill/async.utils** **raceWithTimeout** or **@simpill/http.utils** **fetchWithTimeout**.
- **Per-call overrides** — Options are per instance; use separate instances for different limits per backend/tenant.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Stop calling a failing dependency | **CircuitBreaker** with run() around the call. |
| Cap requests per time window (single process) | **RateLimiter** with maxRequests/windowMs. |
| Limit concurrent executions | **createBulkhead(limit)** and run(fn). |
| Retry with Result instead of throw | **retryResult(fn, options)** with mapError if needed. |
| Backoff jitter | **withJitter(ms, { factor, maxMs })** and pass result to retry delayMs. |
| Distributed / Redis rate limit | Use a dedicated library; RateLimiter is in-memory only. |
| Timeout around a call | Use **@simpill/async.utils** raceWithTimeout or **@simpill/http.utils** fetchWithTimeout. |

Subpaths: `@simpill/resilience.utils`, `./client`, `./server`, `./shared`.

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | CircuitBreaker, RateLimiter, createBulkhead, withJitter |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
