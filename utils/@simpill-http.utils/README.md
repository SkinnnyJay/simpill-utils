# @simpill/http.utils

**Fetch with timeout, retry, and typed HTTP client.**

Fetch with timeout, retry, and a typed client—no axios required.

**Features:** Type-safe · Node & Edge · Lightweight · Uses `@simpill/async.utils` for retry/timeout

## Installation

```bash
npm install @simpill/http.utils @simpill/async.utils
```

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

- **fetchWithTimeout(input, init, fetch?)** — Fetch with AbortController + timeout.
- **fetchWithRetry(input, init?, options?)** — Fetch with retries; options.retry defines policy and optional custom fetch.
- **createHttpClient(options?)** — Returns client with get/post/put/patch/delete; options: baseUrl, defaultTimeoutMs, defaultRetry, fetch.
- **isRetryableStatus(status)** — True for 408, 429, 5xx.

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
| retryableStatuses | isRetryableStatus | Function: return true to treat that status as retryable (then we throw so retry runs). |
| retryableErrors | (err) => true | Function: return false to stop retrying and rethrow. |

Retries happen when the inner fetch returns a retryable status (we throw so **@simpill/async.utils** retry runs) or when fetch throws and **retryableErrors** returns true.

### Idempotent retry

By default we retry on **408, 429, 5xx**. Retrying **non-idempotent** methods (e.g. POST) can cause duplicate side effects. Prefer retry for **GET** or other idempotent calls, or restrict **retryableStatuses** (e.g. only 503) and use **retryableErrors** to avoid retrying on client errors.

### Cookies and headers

No cookie or header helpers. Set **headers** in **RequestInit** or **HttpRequestOptions** (e.g. `client.get("/path", { headers: { "Authorization": "Bearer …" } })`). For cookies, set the **Cookie** header or use a custom fetch that reads from a cookie store.

### Streaming

**fetchWithTimeout** and **fetchWithRetry** return the same **Response** as the underlying fetch; **response.body** is still a stream. Consume it with **response.json()**, **response.text()**, or **response.body** as needed. No extra streaming helpers are provided.

### Abort and timeout errors

- **Timeout:** fetchWithTimeout throws the **Error** you get when the timeout wins the race (e.g. `"Request timed out after 5000ms"`). The AbortController is aborted so the underlying request is cancelled.
- **User abort:** If you pass **signal** (e.g. AbortController.signal) and abort it, fetch typically throws a **DOMException** with name **AbortError**. Check **err.name === "AbortError"** to distinguish from timeout or other errors.

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

**createHttpClient** resolves URLs as: **baseUrl** (trailing slash removed) + **path** (leading slash ensured). So `baseUrl: "https://api.example.com"` and `client.get("users")` → `https://api.example.com/users`; `client.get("/users")` → same. No double slashes; relative paths like `"v1/users"` become `"/v1/users"` and then `base + path`.

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

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

## License

ISC
