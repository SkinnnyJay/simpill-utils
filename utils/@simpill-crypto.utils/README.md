## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fcrypto.utils.svg)](https://www.npmjs.com/package/@simpill/crypto.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-crypto.utils)
</p>

**npm**
```bash
npm install @simpill/crypto.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-crypto.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-crypto.utils` or `npm link` from that directory.

---

## Usage

```ts
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

```ts
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

```ts
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

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
