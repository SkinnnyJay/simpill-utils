<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/errors.utils" width="100%" />
</p>

<p align="center">
  <strong>Typed error classes, error codes, and serializeError</strong>
</p>

<p align="center">
  Custom error classes, error codes, and serializeError for logging and RPC.
</p>

**Features:** Type-safe · Node & Edge · Lightweight

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

**When to use:** You need a typed, serializable error (e.g. `AppError` with code and meta), safe error serialization for logs or APIs, or a shared error-code map. Fits well with [@simpill/patterns.utils](https://github.com/SkinnnyJay/simpill/tree/main/utils/patterns.utils) (Result) and [@simpill/async.utils](https://github.com/SkinnnyJay/simpill/tree/main/utils/async.utils) (retry/fromThrowable).

---

## Installation

```bash
npm install @simpill/errors.utils
```

---

## Quick Start

```typescript
import { AppError, serializeError } from "@simpill/errors.utils";

const err = new AppError("Not found", {
  code: "NOT_FOUND",
  meta: { id: 123 },
});
const serialized = serializeError(err, { includeStack: false });
```

---

## Features

| Feature | Description |
|---------|-------------|
| **AppError** | Error with code, message, meta, cause, toJSON() |
| **serializeError** | Safe serialization for logging or transport |
| **createErrorCodeMap** | Map codes to messages (ERROR_CODES, ErrorCodeOptions) |

---

## Import Paths

```typescript
import { ... } from "@simpill/errors.utils";         // Everything
import { ... } from "@simpill/errors.utils/client";  // Client
import { ... } from "@simpill/errors.utils/server"; // Server
import { ... } from "@simpill/errors.utils/shared"; // Shared only
```

---

## API Reference

- **AppError**(message, options?) — options: **code**, **meta**, **cause** (native `Error.cause`-style chaining)
- **AppErrorMeta** — record for metadata (keep serializable; avoid circular references)
- **serializeError**(error, options?) → SerializedError — options: **includeStack**. Serializes name, message, code, meta, stack. **Cause chains and AggregateError** are not recursed into; serialize `error.cause` separately if needed. Non-Error values become `{ name: "Error", message: string }`. Do not put circular refs in **meta** — serialization does not detect cycles.
- **SerializedError** — name, message, code?, meta?, stack?
- **createErrorCodeMap**, **ERROR_CODES**, **ErrorCode**, **ErrorCodeOptions**

### AppError with cause and meta

```typescript
import { AppError, serializeError } from "@simpill/errors.utils";

const root = new Error("DB connection failed");
const err = new AppError("User load failed", {
  code: "USER_LOAD",
  meta: { userId: 42 },
  cause: root,
});
console.log(serializeError(err, { includeStack: true }));
// Serialize cause separately: serializeError(err.cause)
```

### Logging integration

Pass `serializeError(err, { includeStack: true })` to your logger (e.g. `@simpill/logger.utils`) so error fields are structured. Avoid logging raw `Error` objects in JSON formatters; use serializeError for consistent shape.

### Comparison

- **serialize-error** (npm): similar plain-object serialization; this package aligns with AppError (code, meta).
- **http-errors**: provides HTTP status codes and factory constructors; use AppError for domain errors and map code → status in your API layer if needed.

### HTTP status mapping

There is **no** built-in map from **ErrorCode** (or **AppError.code**) to HTTP status. Map in your API layer, e.g. **NOT_FOUND** → 404, **UNAUTHORIZED** → 401, **FORBIDDEN** → 403, **BAD_REQUEST** / **VALIDATION** → 400, **CONFLICT** → 409, **TIMEOUT** → 408, **INTERNAL** → 500. Example: `const statusByCode: Partial<Record<string, number>> = { NOT_FOUND: 404, BAD_REQUEST: 400 }; res.status(statusByCode[err.code] ?? 500).json(serializeError(err))`.

### Result-style helpers

This package does **not** define Result types. Use **@simpill/patterns.utils**: **toResult**(promise, mapError) and **fromPromise**(fn, mapError) return **Promise&lt;Result&lt;T, AppError&gt;&gt;** with **mapError** defaulting to wrapping unknown errors as **AppError**. Use **@simpill/resilience.utils** **retryResult** for retry that returns **Result&lt;T, AppError&gt;** instead of throwing.

### fromUnknown helper

There is **no** **fromUnknown**(e) export. To turn an **unknown** caught value into **AppError**: `if (e instanceof AppError) return e; if (e instanceof Error) return new AppError(e.message, { code: ERROR_CODES.INTERNAL, cause: e }); return new AppError(String(e), { code: ERROR_CODES.INTERNAL });`. **patterns.utils** **fromThrowable** + **err**(e) gives **Result&lt;never, unknown&gt;**; use **toResult**/ **fromPromise** with a **mapError** that does the above for **AppError**.

### Error code namespaces

**ERROR_CODES** is a flat object (**BAD_REQUEST**, **NOT_FOUND**, etc.). For namespacing (e.g. **AUTH.FORBIDDEN**, **USER.NOT_FOUND**), use string code values with a prefix when creating **AppError**, or maintain separate code maps per domain and pass the code string. **createErrorCodeMap** accepts **Partial&lt;Record&lt;ErrorCode, string&gt;&gt;**; for custom codes use a broader type or a second map for extended codes.

### What we don't provide

- **HTTP status mapping** — No built-in code → status map; build one in your API layer (e.g. NOT_FOUND → 404, BAD_REQUEST → 400).
- **Result types** — Use **@simpill/patterns.utils** (**toResult**, **fromPromise**) with **mapError** that returns **AppError**.
- **fromUnknown** — No helper; wrap unknown caught values in **AppError** manually (e.g. `instanceof Error` → use message and cause; else **AppError(String(e))**).
- **Namespaced error codes** — **ERROR_CODES** is flat; use string prefixes (e.g. `"AUTH.FORBIDDEN"`) or separate code maps per domain.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Domain/API errors with code and meta | Use **AppError** with **ERROR_CODES** and **meta**; serialize with **serializeError** for logs or responses. |
| Map error to HTTP status | Build a **code → status** map in your API layer; **ERROR_CODES** names align with common statuses. |
| Turn thrown/unknown into Result | Use **patterns.utils** **fromPromise**/ **toResult** with **mapError** that returns **AppError**. |
| Consistent error messages | Use **createErrorCodeMap** and use the map when creating or displaying errors. |

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | AppError, serializeError |

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
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
