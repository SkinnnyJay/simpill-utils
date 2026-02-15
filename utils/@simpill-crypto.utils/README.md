<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/crypto.utils" width="100%" />
</p>

<p align="center">
  <strong>Hash, randomBytes, timing-safe compare (Node.js)</strong>
</p>

<p align="center">
  Hash, random bytes, and timing-safe compare for Node.js.
</p>

**Features:** Type-safe · Node only · Lightweight

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

**When to use:** Hashing (SHA-1/256/384/512), secure random bytes, or constant-time comparison in Node.js. **Server only:** All hashing and random APIs require Node.js `crypto`; use `@simpill/crypto.utils/server`. The client entrypoint exposes types only (e.g. `HashAlgorithm`) for shared typings — no runtime crypto on the client.

---

## Installation

```bash
npm install @simpill/crypto.utils
```

---

## Quick Start

```typescript
import { hash, randomBytesHex } from "@simpill/crypto.utils/server";

const digest = hash("hello", "sha256"); // (data, algorithm?) → hex string
const token = randomBytesHex(16);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **hash** | **Sync** hash (sha1, sha256, sha384, sha512) → hex string |
| **randomBytesSecure** | Cryptographically secure random bytes (Buffer) |
| **randomBytesHex** | Random bytes as hex string |
| **timingSafeEqualBuffer** | Constant-time comparison (server only) |

---

## Import Paths

```typescript
import { ... } from "@simpill/crypto.utils";         // Everything
import { ... } from "@simpill/crypto.utils/server";  // Node.js (hash, randomBytes, timingSafeEqual)
import { ... } from "@simpill/crypto.utils/client";  // Types only (HashAlgorithm)
import { ... } from "@simpill/crypto.utils/shared";  // Types only
```

---

## API Reference

- **hash**(data, algorithm?) → string — **synchronous**; hashes to hex. `data` is string (UTF-8) or Buffer; algorithm: HashAlgorithm (default sha256).
- **randomBytesSecure**(length) → Buffer — throws `RangeError` if length is negative or not an integer.
- **randomBytesHex**(length) → string
- **timingSafeEqualBuffer**(a, b) → boolean — constant-time comparison. **Important:** If `a` and `b` have different lengths, returns `false` without comparing (to avoid leaking length). Normalize lengths before comparing (e.g. hash both values and compare hashes of the same length).
- **HashAlgorithm** — "sha1" | "sha256" | "sha384" | "sha512"

### timingSafeEqualBuffer example

Use for comparing secrets (tokens, HMACs) without timing side-channels. Ensure both inputs have the same length; otherwise the function returns false and does not perform a comparison:

```typescript
import { timingSafeEqualBuffer, hash } from "@simpill/crypto.utils/server";

const secret = process.env.API_SECRET ?? "";
const provided = req.headers["x-api-key"] ?? "";
// Compare fixed-length hashes so lengths always match for valid input
const secretHash = hash(secret, "sha256");
const providedHash = hash(provided, "sha256");
if (timingSafeEqualBuffer(secretHash, providedHash)) {
  // authenticated
}
```

### What we don’t provide

- **HMAC** — No HMAC helpers. Use Node `crypto.createHmac(algorithm, key).update(data).digest('hex')` (or another encoding).
- **KDF / password hashing** — No PBKDF2, scrypt, or argon2. Use Node `crypto.pbkdf2`, `crypto.scrypt`, or a dedicated library (e.g. `argon2`).
- **Hash output encodings** — `hash()` returns hex only. For base64 or Buffer, use Node `crypto.createHash(algorithm).update(data).digest()` with the desired encoding.
- **randomUUID** — Use the global `crypto.randomUUID()` (Node 19+ / modern runtimes) or `generateUUID` from `@simpill/uuid.utils`.
- **WebCrypto (client)** — This package is server-only for runtime crypto. In the browser use `crypto.subtle` for hashing and key derivation.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | hash, randomBytesHex (Node.js server) |

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
