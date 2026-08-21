## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ferrors.utils.svg)](https://www.npmjs.com/package/@simpill/errors.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-errors.utils)
</p>

**npm**
```bash
npm install @simpill/errors.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-errors.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-errors.utils` or `npm link` from that directory.

---

## Usage

```ts
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
| **AppError** | Error with code, message, meta, cause (native non-enumerable semantics), toJSON() |
| **serializeError** | Always-JSON-safe serialization: circular meta/cause handled, AggregateError `errors`, extra props preserved |
| **deserializeError** | Rebuild an Error from a SerializedError (reverse of serializeError) |
| **createErrorCodeMap / createErrorFromCode** | Map codes to messages and construct AppError from a code |
| **httpStatusFromCode / errorCodeFromStatus** | Bidirectional ErrorCode ↔ HTTP status mapping |
| **toProblemDetails** | RFC 9457 `application/problem+json` responses (never leaks stack/cause) |
| **isError / isErrorLike / isAppError** | Cross-realm-safe error detection (native `Error.isError` when available) |
| **sanitizeForJson** | Deep-sanitize any value so JSON.stringify never throws |

---

## Import Paths

```ts
import { ... } from "@simpill/errors.utils";         // Everything
import { ... } from "@simpill/errors.utils/client";  // Client
import { ... } from "@simpill/errors.utils/server"; // Server
import { ... } from "@simpill/errors.utils/shared"; // Shared only
```

---

## API Reference

- **AppError**(message, options?) — options: **code**, **meta**, **cause** (native `Error.cause`-style chaining)
- **AppErrorMeta** — record for metadata (keep serializable; avoid circular references)
- **serializeError**(error, options?) → SerializedError — options: **includeStack**, **includeCause**, **maxCauseDepth**. The result is **always safe to `JSON.stringify`**: circular references in meta, cause chains, or extra props are cycle-detected and replaced with `"[Circular]"`; bigint/symbol/function/Date/Map/Set are converted to JSON-safe forms. **AggregateError** inner `errors` are serialized. Extra own enumerable properties (Node's `errno`/`syscall`/`path`, custom fields) are preserved under `props`. Error-like objects (name+message, e.g. cross-realm or postMessage payloads) keep their identity; thrown primitives keep their value in `message`; other values are attached as sanitized `data`.
- **SerializedError** — name, message, code?, meta?, stack?, cause?, errors?, props?, data?
- **deserializeError**(serialized) → Error — restores name, message, stack, code, meta, cause chain, and inner errors
- **isError** / **isErrorLike** / **isAppError** — cross-realm-safe detection (uses native `Error.isError` when available)
- **sanitizeForJson**(value, maxDepth?) — deep-sanitize any value to a JSON-stringify-safe form
- **createErrorCodeMap**, **createErrorFromCode**, **ERROR_CODES**, **ErrorCode**, **ErrorCodeOptions**
- **HTTP_STATUS_BY_CODE**, **httpStatusFromCode**(code, fallback?), **errorCodeFromStatus**(status)
- **toProblemDetails**(error, options?) → ProblemDetails (RFC 9457), **PROBLEM_JSON_CONTENT_TYPE**

### AppError with cause and meta

```ts
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

Built in: **HTTP_STATUS_BY_CODE** maps every **ErrorCode** to a status (**NOT_FOUND** → 404, **VALIDATION** → 422, **TIMEOUT** → 504, ...). Use **httpStatusFromCode**(code) / **errorCodeFromStatus**(status) for the two directions, and **toProblemDetails**(err, { instance: req.path }) to build an RFC 9457 `application/problem+json` body that never leaks stacks or causes: `res.status(problem.status).type(PROBLEM_JSON_CONTENT_TYPE).json(problem)`.

### Result-style helpers

This package does **not** define Result types. Use **@simpill/patterns.utils**: **toResult**(promise, mapError) and **fromPromise**(fn, mapError) return **Promise&lt;Result&lt;T, AppError&gt;&gt;** with **mapError** defaulting to wrapping unknown errors as **AppError**. Use **@simpill/resilience.utils** **retryResult** for retry that returns **Result&lt;T, AppError&gt;** instead of throwing.

### fromUnknown helper

There is **no** **fromUnknown**(e) export. To turn an **unknown** caught value into **AppError**: `if (e instanceof AppError) return e; if (e instanceof Error) return new AppError(e.message, { code: ERROR_CODES.INTERNAL, cause: e }); return new AppError(String(e), { code: ERROR_CODES.INTERNAL });`. **patterns.utils** **fromThrowable** + **err**(e) gives **Result&lt;never, unknown&gt;**; use **toResult**/ **fromPromise** with a **mapError** that does the above for **AppError**.

### Error code namespaces

**ERROR_CODES** is a flat object (**BAD_REQUEST**, **NOT_FOUND**, etc.). For namespacing (e.g. **AUTH.FORBIDDEN**, **USER.NOT_FOUND**), use string code values with a prefix when creating **AppError**, or maintain separate code maps per domain and pass the code string. **createErrorCodeMap** accepts **Partial&lt;Record&lt;ErrorCode, string&gt;&gt;**; for custom codes use a broader type or a second map for extended codes.

### What we don't provide

- **Result types** — Use **@simpill/patterns.utils** (**toResult**, **fromPromise**) with **mapError** that returns **AppError**.
- **fromUnknown** — No helper; wrap unknown caught values in **AppError** manually (e.g. `instanceof Error` → use message and cause; else **AppError(String(e))**).
- **Namespaced error codes** — **ERROR_CODES** is flat; use string prefixes (e.g. `"AUTH.FORBIDDEN"`) or separate code maps per domain.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Domain/API errors with code and meta | Use **AppError** with **ERROR_CODES** and **meta**; serialize with **serializeError** for logs or responses. |
| Map error to HTTP status | Use **httpStatusFromCode** / **toProblemDetails** (RFC 9457) — built in. |
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

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
