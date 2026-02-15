<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/uuid.utils" width="100%" />
</p>

<p align="center">
  <strong>UUID helpers: generate (v1/v4/v5), validate, compare</strong>
</p>

<p align="center">
  Generate and validate UUIDs (v1/v4/v5) with full TypeScript support.
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

**When to use:** You need to generate, validate, or compare UUIDs (v1/v4/v5) with a small, type-safe API. Use `generateUUID()` or `generateUUIDv4()` for IDs; use `isUUID` / `validateUUID` for input validation (both return a boolean; neither throws). Use `compareUUIDs` for equality checks (returns boolean). All APIs work in Node and browser; use `@simpill/uuid.utils/shared` or the main entry — client/server entries re-export the same shared code.

---

## Installation

```bash
npm install @simpill/uuid.utils
```

---

## Quick Start

```typescript
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

```typescript
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

```typescript
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
