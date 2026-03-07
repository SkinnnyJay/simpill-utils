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

const id = generateUUID();
const v4 = generateUUIDv4();
if (isUUID(id)) { /* ... */ }
validateUUID(id); // true if valid, false otherwise (does not throw)
compareUUIDs(a, b); // true if equal, false otherwise
parseUUID(str);    // returns UUID string or null
```

---

## Features

| Feature | Description |
|---------|-------------|
| **generateUUID** / **generateUUIDv4** | Generate UUIDs (v4 default) |
| **generateUUIDv1** / **generateUUIDv5** | Version-specific generation |
| **validateUUID** | Returns true if valid, false otherwise (does not throw) |
| **isUUID** | Type guard / boolean check (same as validateUUID) |
| **parseUUID** | Returns UUID string if valid, otherwise null |
| **compareUUIDs** | Returns true if equal, false otherwise (case-sensitive) |
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

- **generateUUID**(), **generateUUIDv1**(), **generateUUIDv4**(), **generateUUIDv5**(namespace, name)
- **validateUUID**(uuid) → boolean — true if valid RFC 4122 UUID
- **isUUID**(uuid) → boolean — same as validateUUID
- **parseUUID**(value) → string | null — returns the string if valid, null otherwise
- **compareUUIDs**(a, b) → boolean — true if equal (case-sensitive)
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

**Case sensitivity:** RFC 4122 permits lowercase and uppercase hex. This package compares UUIDs with strict string equality (`compareUUIDs`); normalize to lowercase (e.g. `uuid.toLowerCase()`) before comparing if you need case-insensitive equality.

### What we don’t provide

- **UUID v3 / v7** — Only v1, v4, and v5 are supported. For v3 (MD5-based) or v7 (time-ordered), use the `uuid` package directly.
- **Stringify / parse bytes** — No conversion between UUID strings and 16-byte buffers. Use the `uuid` package (`bufferFromUUID` / `uuidToBuffer`-style APIs) if you need binary serialization.
- **Version-specific guards** — No `isUUIDv4(str)` or similar. Use `validateUUID(str)` and, if you need the version, parse the 13th character (e.g. `str[14]` for the version nibble) or use a library that exposes version helpers.

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | generateUUID, validateUUID, isUUID, parseUUID, compareUUIDs |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
