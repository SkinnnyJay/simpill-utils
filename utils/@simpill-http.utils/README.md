## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fhttp.utils.svg)](https://www.npmjs.com/package/@simpill/http.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-http.utils)
</p>

**npm**
```bash
npm install @simpill/http.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-http.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-http.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  fetchWithTimeout,
  fetchWithRetry,
  createHttpClient,
  isRetryableStatus,
} from "@simpill/http.utils";

// Timeout
const res = await fetchWithTimeout("https://api.example.com", { timeoutMs: 5000 });

// Retry (default: 408, 429, 5xx)
const res2 = await fetchWithRetry("https://api.example.com", undefined, {
  retry: { maxAttempts: 3, delayMs: 100, backoffMultiplier: 2 },
});

// Typed client
const client = createHttpClient({
  baseUrl: "https://api.example.com",
  defaultTimeoutMs: 5000,
  defaultRetry: { maxAttempts: 3 },
});
const users = await client.get("/users");
const created = await client.post("/users", JSON.stringify({ name: "Jane" }));
```

## API

- **fetchWithTimeout(input, init, fetch?)** — Fetch with AbortController + timeout; throws typed **HttpTimeoutError** and propagates abort reasons.
- **fetchWithRetry(input, init?, options?)** — Fetch with retries; options.retry defines policy and optional custom fetch. Honors Retry-After, respects abort signals, cancels discarded response bodies.
- **createHttpClient(options?)** — Returns client with get/head/post/put/patch/delete; options: baseUrl, defaultTimeoutMs, defaultRetry, defaultHeaders, fetch. Per-request `retry` override supported; retry and timeout compose (timeout applies per attempt).
- **isRetryableStatus(status)** — True for 408, 429, 5xx.
- **parseRetryAfterMs(value, now?)** — RFC 9110 Retry-After parser (delta-seconds or HTTP-date) → ms or undefined.
- **HttpTimeoutError / RetryableStatusError** — Typed errors (see below).

### Interceptors and middleware

There are **no** interceptors or request/response middleware. To add headers, logging, or auth, pass a **custom fetch** (e.g. `options.fetch` in createHttpClient or fetchWithRetry) that wraps the real fetch and modifies `Request`/`Response` or init before/after the call.

### JSON parse and error mapping

The package returns the raw **Response**. Call **response.json()**, **response.text()**, etc. yourself and handle parse errors. There is no built-in error-to-HTTP-status or response-body mapping; use **@simpill/errors.utils** or your own mapping if needed.

### Retry policy

**HttpRetryPolicy** (used by fetchWithRetry and createHttpClient defaultRetry):

| Option | Default | Description |
|--------|---------|-------------|
| maxAttempts | 3 | Total attempts (first + retries). |
| delayMs | 0 | Delay before first retry (ms). |
| backoffMultiplier | 1 | Multiply delay by this after each retry. |
| retryableStatuses | isRetryableStatus | Function: return true to treat that status as retryable. |
| retryableErrors | (err) => true | Function: return false to stop retrying and rethrow. |
| timeoutMs | — | Per-attempt timeout (ms); a timed-out attempt is aborted and retried like any other error. |
| respectRetryAfter | true | Honor **Retry-After** headers (delta-seconds or HTTP-date, RFC 9110) on retryable responses. |
| maxRetryAfterMs | 30000 | Cap for Retry-After waits (mirrors undici RetryHandler maxTimeout). |
| jitter | false | Full jitter: each delay becomes uniform random in [0, delay]. |
| retryMethods | — (all) | If set, only these methods are retried (e.g. `["GET","PUT","HEAD","OPTIONS","DELETE"]`); others fail fast. |

Retries happen when fetch returns a retryable status or when fetch throws and **retryableErrors** returns true. An aborted **signal** stops the retry sequence immediately (delays are abort-aware too), and requests with a **ReadableStream** body are never retried (the stream is already consumed). Discarded retryable responses have their bodies cancelled so the underlying connection is released; the final failure throws **RetryableStatusError** with the intact **Response** attached.

### Idempotent retry

By default we retry on **408, 429, 5xx**. Retrying **non-idempotent** methods (e.g. POST) can cause duplicate side effects. Set **retryMethods** to an idempotent allowlist (undici's default is `["GET","PUT","HEAD","OPTIONS","DELETE"]`), or restrict **retryableStatuses** and use **retryableErrors** to avoid retrying on client errors.

### Cookies and headers

No cookie or header helpers. Set **headers** in **RequestInit** or **HttpRequestOptions** (e.g. `client.get("/path", { headers: { "Authorization": "Bearer …" } })`). For cookies, set the **Cookie** header or use a custom fetch that reads from a cookie store.

### Streaming

**fetchWithTimeout** and **fetchWithRetry** return the same **Response** as the underlying fetch; **response.body** is still a stream. Consume it with **response.json()**, **response.text()**, or **response.body** as needed. No extra streaming helpers are provided.

### Abort and timeout errors

- **Timeout:** fetchWithTimeout throws **HttpTimeoutError** (message `"Request timed out after 5000ms"`, `name === "TimeoutError"` to match the AbortSignal.timeout convention, plus a `timeoutMs` field). The underlying request is aborted at the deadline with the timeout error as the abort reason.
- **User abort:** If you pass **signal** and abort it, your abort **reason** is propagated to the request, and fetchWithRetry stops retrying immediately. Check **err.name === "AbortError"** vs **"TimeoutError"** to distinguish.
- **Exhausted retries on a retryable status:** fetchWithRetry throws **RetryableStatusError** (message `"Retryable status: 503"`, plus `status` and the final **Response** with its body intact).

### Custom fetch

Pass **options.fetch** to **createHttpClient**, **fetchWithRetry**, or **fetchWithTimeout** to use a different implementation (e.g. global fetch, node-fetch, undici, or a wrapper that adds headers):

```ts
const client = createHttpClient({
  baseUrl: "https://api.example.com",
  fetch: (input, init) => {
    return fetch(input, { ...init, headers: { ...init?.headers, "X-Custom": "yes" } });
  },
});
```

### baseUrl joining

**createHttpClient** resolves URLs as: **baseUrl** (trailing slash removed) + **path** (leading slash ensured). So `baseUrl: "https://api.example.com"` and `client.get("users")` → `https://api.example.com/users`; `client.get("/users")` → same. No double slashes; relative paths like `"v1/users"` become `"/v1/users"` and then `base + path`. **Absolute URLs bypass baseUrl** (axios/ky semantics): `client.get("https://other.example.org/health")` is used as-is.

### Comparison with axios / ky / undici

This package is a **thin fetch wrapper** (timeout, retry, small client). For interceptors, request/response transforms, upload progress, or Node-specific features use **axios**, **ky**, or **undici**. For retry + timeout on top of fetch with minimal deps, this package fits.

### What we don't provide

- **Interceptors / middleware** — No request/response pipeline; use a **custom fetch** (options.fetch) that wraps the real fetch and modifies Request/Response or init.
- **JSON parse / error mapping** — Call **response.json()** or **response.text()** yourself; no built-in error-to-status or body mapping (use **@simpill/errors.utils** or your own).
- **Cookie / header helpers** — Set **headers** (including **Cookie**) in **RequestInit** or **HttpRequestOptions**; no parse/serialize helpers.
- **Streaming helpers** — The **Response** is returned as-is; consume **response.body** yourself; no extra streaming APIs.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Timeout + retry with fetch | Use **fetchWithTimeout** / **fetchWithRetry** or **createHttpClient** with defaultRetry. |
| Base URL + method helpers | Use **createHttpClient** with **baseUrl**. |
| Custom fetch (test, Node, wrapper) | Pass **options.fetch** everywhere it’s supported. |
| JSON / error mapping | Handle **response.json()** and errors in your code; no helpers here. |
| Interceptors / middleware | Use a custom **fetch** wrapper or axios/ky/undici. |

Subpaths: `@simpill/http.utils`, `@simpill/http.utils/client`, `@simpill/http.utils/server`, `@simpill/http.utils/shared`.

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | fetchWithTimeout, fetchWithRetry, createHttpClient, isRetryableStatus |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
