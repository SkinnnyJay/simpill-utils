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
| **hash / hashBuffer** | **Sync** hash (sha1, sha256, sha384, sha512) → hex, base64, base64url, or Buffer |
| **hmac / hmacBuffer** | HMAC (RFC 2104) under a key, same encodings |
| **safeEqual** | Length-independent constant-time compare (hash-then-compare) |
| **timingSafeEqualBuffer** | Same-length constant-time comparison (legacy; leaks length via timing) |
| **hashPassword / verifyPassword** | Password storage: scrypt (OWASP 2026 params) or native argon2id, self-describing PHC strings |
| **hkdf** | RFC 5869 key derivation (subkeys from a master key) |
| **pbkdf2** | PBKDF2 (600k iterations of HMAC-SHA256 by default) for FIPS/interop |
| **scryptDerive** | Raw scrypt (RFC 7914) with explicit parameters |
| **randomBytesSecure** | Cryptographically secure random bytes (Buffer) |
| **randomBytesHex / randomBytesBase64Url** | Random bytes as hex or URL-safe token |
| **randomIntSecure** | Uniform random integer without modulo bias |

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

- **hash**(data, algorithm?, encoding?) → string — **synchronous**; algorithm default sha256, encoding "hex" | "base64" | "base64url" (default hex). **hashBuffer**(data, algorithm?) → Buffer.
- **hmac**(key, data, algorithm?, encoding?) → string / **hmacBuffer**(key, data, algorithm?) → Buffer — HMAC verified against RFC 4231 test vectors.
- **safeEqual**(a, b) → boolean — **preferred secret comparison.** Length-independent constant time via the hash-then-compare pattern: both inputs are digested to fixed 32-byte SHA-256 values before `crypto.timingSafeEqual`, so timing reveals neither the differing byte position nor whether the lengths match.
- **timingSafeEqualBuffer**(a, b) → boolean — legacy same-length comparison, kept for backward compatibility. **Warning:** its early return on length mismatch is observable (~73× faster path measured on a 4 KiB secret), so an attacker can learn a secret's length from timing. Prefer `safeEqual`.
- **hashPassword**(password, options?) → string — password storage. Default scrypt N=2^17, r=8, p=1 (OWASP 2026), 16-byte random salt, 32-byte key; ~470 ms per hash on a typical server core. Emits a self-describing PHC string (`$scrypt$ln=17,r=8,p=1$<salt>$<hash>`). `{ algorithm: "argon2id" }` uses native `crypto.argon2Sync` on Node ≥ 26 (m=64 MiB, t=3, p=4) and throws a clear error elsewhere — check `hasArgon2()`.
- **verifyPassword**(password, stored) → boolean — recomputes with the parameters embedded in the stored string and compares via `safeEqual`. Returns `false` for a wrong password; throws `TypeError` for an unrecognized format.
- **hkdf**(ikm, { salt?, info?, length?, algorithm? }) → Buffer — RFC 5869 (test-vector verified). Derive purpose-specific subkeys from one master key; not for passwords.
- **pbkdf2**(password, salt, { iterations?, length?, algorithm? }) → Buffer — defaults 600,000 iterations HMAC-SHA256 (OWASP 2026). For FIPS/interop; prefer `hashPassword` otherwise.
- **scryptDerive**(password, salt, keyLength, cost, blockSize, parallelism) → Buffer — raw RFC 7914 scrypt (test-vector verified) with `maxmem` sized automatically (Node's 32 MiB default otherwise rejects OWASP-scale parameters).
- **randomBytesSecure**(length) → Buffer — throws `RangeError` if length is negative or not an integer.
- **randomBytesHex**(length) → string · **randomBytesBase64Url**(length) → string — URL-safe unpadded token for URLs, cookies, headers.
- **randomIntSecure**(min, max) → number — uniform integer in [min, max) via `crypto.randomInt`, no modulo bias. Throws `RangeError` for invalid ranges (incl. range ≥ 2^48).
- **hasArgon2**() → boolean — whether this Node build ships native argon2id.
- **HashAlgorithm** — "sha1" | "sha256" | "sha384" | "sha512" · **DigestEncoding** — "hex" | "base64" | "base64url" · **PasswordAlgorithm** — "scrypt" | "argon2id"

### Comparing secrets

```ts
import { safeEqual } from "@simpill/crypto.utils/server";

const secret = process.env.API_SECRET ?? "";
const provided = req.headers["x-api-key"] ?? "";
if (safeEqual(secret, provided)) {
  // authenticated — no length normalization needed
}
```

### Password storage

```ts
import { hashPassword, verifyPassword } from "@simpill/crypto.utils/server";

const stored = hashPassword(newUserPassword);        // "$scrypt$ln=17,r=8,p=1$…$…"
// later:
if (verifyPassword(loginAttempt, stored)) { /* ok */ }
```

### What we don’t provide

- **randomUUID** — Use the global `crypto.randomUUID()` (Node 19+ / modern runtimes) or `generateUUID` from `@simpill/uuid.utils`.
- **WebCrypto (client)** — This package is server-only for runtime crypto. In the browser use `crypto.subtle` for hashing and key derivation.
- **bcrypt** — bcrypt has a 72-byte input limit and no memory hardness; `hashPassword`'s scrypt/argon2id defaults are the modern recommendation.

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
