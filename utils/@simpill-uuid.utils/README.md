## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fuuid.utils.svg)](https://www.npmjs.com/package/@simpill/uuid.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-uuid.utils)
</p>

**npm**
```bash
npm install @simpill/uuid.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-uuid.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-uuid.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  generateUUID,
  generateUUIDv4,
  isUUID,
  validateUUID,
  compareUUIDs,
} from "@simpill/uuid.utils";

const id = generateUUID();          // v4, native crypto.randomUUID fast path
const v7 = generateUUIDv7();        // RFC 9562 time-ordered, monotonic (great for DB keys)
if (isUUID(id)) { /* ... */ }
validateUUID(id); // true if valid RFC 9562 UUID (versions 1-8, Nil, Max); does not throw
compareUUIDs(a, b); // true if same UUID (case-insensitive per RFC 9562)
parseUUID(str);     // returns UUID string or null
getUUIDv7Timestamp(v7); // Unix ms embedded in a v7 UUID
```

---

## Features

| Feature | Description |
|---------|-------------|
| **generateUUID** / **generateUUIDv4** | Generate v4 UUIDs (native `crypto.randomUUID` fast path) |
| **generateUUIDv7** | RFC 9562 time-ordered UUIDs with a per-process monotonicity guarantee |
| **generateUUIDv1** / **generateUUIDv5** | Version-specific generation |
| **validateUUID** | True for any valid RFC 9562 UUID (versions 1-8, Nil, Max); does not throw |
| **isUUID** / **isUUIDv7** | Boolean checks |
| **uuidVersion** | Extract the version number (1-8; 0 for Nil/Max; null if invalid) |
| **getUUIDv7Timestamp** | Unix millisecond timestamp embedded in a v7 UUID |
| **parseUUID** / **normalizeUUID** | Validate-and-return; normalize returns canonical lowercase |
| **compareUUIDs** | True if same UUID — case-insensitive per RFC 9562 |
| **NIL_UUID** / **MAX_UUID** | RFC 9562 special-value constants |
| **UUIDHelper** | Object with same methods |

---

## Import Paths

```ts
import { ... } from "@simpill/uuid.utils";         // Everything
import { ... } from "@simpill/uuid.utils/client"; // Client
import { ... } from "@simpill/uuid.utils/server"; // Server
import { ... } from "@simpill/uuid.utils/shared";  // Shared only
```

---

## API Reference

- **generateUUID**(), **generateUUIDv1**(), **generateUUIDv4**(), **generateUUIDv5**(name, namespace), **generateUUIDv7**()
- **validateUUID**(uuid) → boolean — true if valid RFC 9562 UUID (versions 1-8, Nil, Max)
- **isUUID**(uuid) → boolean — same as validateUUID
- **isUUIDv7**(uuid) → boolean — true if a valid v7 UUID
- **uuidVersion**(uuid) → number | null — version 1-8, 0 for Nil/Max, null if invalid
- **getUUIDv7Timestamp**(uuid) → number | null — Unix ms embedded in a v7 UUID
- **parseUUID**(value) → string | null — returns the string if valid, null otherwise
- **normalizeUUID**(value) → string | null — canonical lowercase form, null if invalid
- **compareUUIDs**(a, b) → boolean — true if same UUID (case-insensitive per RFC 9562)
- **NIL_UUID**, **MAX_UUID** — special-value constants
- **UUIDHelper** — namespace object with the same methods

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

**validateUUID vs parseUUID:** `validateUUID(str)` returns `true`/`false` and never throws. Use it for checks. `parseUUID(str)` returns the string if valid or `null` otherwise — use it when you need a single call that both validates and returns the value (or null).

**v5 (namespace + name):** Pass a namespace UUID and a name; the same name in the same namespace always yields the same UUID (e.g. for stable IDs from URLs):

```ts
import { generateUUIDv5 } from "@simpill/uuid.utils";
import { NAMESPACE_DNS } from "uuid";

const id = generateUUIDv5("example.com", NAMESPACE_DNS);
```

**Case sensitivity:** RFC 9562 permits lowercase and uppercase hex and assigns no meaning to case. `compareUUIDs` is case-insensitive accordingly (with an `===` fast path). Use `normalizeUUID` to get the canonical lowercase form for storage.

**UUIDv7 for database keys:** `generateUUIDv7()` embeds a 48-bit Unix millisecond timestamp, so IDs sort chronologically and cluster well in B-tree indexes. Within a process, output is strictly monotonic even under high-frequency generation (RFC 9562 §6.2 Method 1: dedicated 12-bit counter in `rand_a`, random-seeded per tick) and never regresses when the system clock steps backwards.

### What we don’t provide

- **UUID v3 / v6 / v8 generation** — v1, v4, v5, and v7 are supported for generation. For v3 (MD5-based), v6, or v8, use the `uuid` package directly. (Validation accepts all RFC 9562 versions.)
- **Stringify / parse bytes** — No conversion between UUID strings and 16-byte buffers. Use the `uuid` package if you need binary serialization.

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | generateUUID, validateUUID, isUUID, parseUUID, compareUUIDs |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
