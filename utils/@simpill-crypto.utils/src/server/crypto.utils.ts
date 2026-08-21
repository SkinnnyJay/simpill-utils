/**
 * Crypto utilities using Node.js crypto module.
 * Server/Node only.
 */

import * as nodeCrypto from "node:crypto";
import {
  createHash,
  createHmac,
  hkdfSync,
  pbkdf2Sync,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type {
  DigestEncoding,
  HashAlgorithm,
  HashPasswordOptions,
  HkdfOptions,
  Pbkdf2Options,
} from "../shared";
import {
  ERROR_ARGON2_UNAVAILABLE,
  ERROR_KDF_PARAM_RANGE,
  ERROR_PHC_FORMAT,
  ERROR_RANDOM_BYTES_LENGTH,
  ERROR_RANDOM_INT_RANGE,
  ERROR_SCRYPT_COST,
  KDF_BOUNDS,
  VALUE_0,
} from "../shared/constants";

const DEFAULT_ALGORITHM: HashAlgorithm = "sha256";
const DEFAULT_ENCODING: DigestEncoding = "hex";

function toBuffer(data: string | Buffer): Buffer {
  return typeof data === "string" ? Buffer.from(data, "utf8") : data;
}

/** Hash input to a digest string (default sha256 / hex). Strings UTF-8 encoded. */
export function hash(
  data: string | Buffer,
  algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
  encoding: DigestEncoding = DEFAULT_ENCODING,
): string {
  return createHash(algorithm).update(toBuffer(data)).digest(encoding);
}

/** Hash input to a raw Buffer digest (default sha256). */
export function hashBuffer(
  data: string | Buffer,
  algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
): Buffer {
  return createHash(algorithm).update(toBuffer(data)).digest();
}

/** HMAC of data under key (default sha256 / hex). RFC 2104 via node:crypto. */
export function hmac(
  key: string | Buffer,
  data: string | Buffer,
  algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
  encoding: DigestEncoding = DEFAULT_ENCODING,
): string {
  return createHmac(algorithm, toBuffer(key)).update(toBuffer(data)).digest(encoding);
}

/** HMAC of data under key as a raw Buffer (default sha256). */
export function hmacBuffer(
  key: string | Buffer,
  data: string | Buffer,
  algorithm: HashAlgorithm = DEFAULT_ALGORITHM,
): Buffer {
  return createHmac(algorithm, toBuffer(key)).update(toBuffer(data)).digest();
}

/** Cryptographically secure random bytes. Throws RangeError if length < 0 or not integer. */
export function randomBytesSecure(length: number): Buffer {
  if (length < VALUE_0 || !Number.isInteger(length)) {
    throw new RangeError(ERROR_RANDOM_BYTES_LENGTH);
  }
  return randomBytes(length);
}

/** Cryptographically secure random bytes as hex string (length 2 * byteCount). Same throws as randomBytesSecure. */
export function randomBytesHex(length: number): string {
  return randomBytesSecure(length).toString("hex");
}

/** Cryptographically secure random bytes as a URL-safe base64url string (no padding).
 * Ideal for tokens in URLs, cookies, and headers. Same throws as randomBytesSecure. */
export function randomBytesBase64Url(length: number): string {
  return randomBytesSecure(length).toString("base64url");
}

/** Uniform random integer in [min, max) without modulo bias (crypto.randomInt).
 * Throws RangeError for non-safe-integer bounds, min >= max, or range >= 2^48. */
export function randomIntSecure(min: number, max: number): number {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min >= max ||
    max - min >= 2 ** 48
  ) {
    throw new RangeError(ERROR_RANDOM_INT_RANGE);
  }
  return randomInt(min, max);
}

/** Constant-time comparison of same-length inputs; returns false immediately if
 * lengths differ. WARNING: the early return on length mismatch is observable —
 * an attacker can learn a secret's LENGTH from timing (~73x faster path measured
 * on a 4 KiB secret). Prefer safeEqual, which is length-independent. Kept for
 * backward compatibility. */
export function timingSafeEqualBuffer(a: Buffer | string, b: Buffer | string): boolean {
  const bufA = toBuffer(a);
  const bufB = toBuffer(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Length-independent constant-time equality (hash-then-compare pattern).
 * Both inputs are digested to fixed 32-byte SHA-256 values which are compared
 * with crypto.timingSafeEqual, so execution time does not depend on where the
 * inputs differ or whether their lengths match. Use for comparing secrets
 * (tokens, API keys, MACs) of possibly different lengths. */
export function safeEqual(a: Buffer | string, b: Buffer | string): boolean {
  const bufA = toBuffer(a);
  const bufB = toBuffer(b);
  const digestA = createHash("sha256").update(bufA).digest();
  const digestB = createHash("sha256").update(bufB).digest();
  // Both operands are fully evaluated before the bitwise & — no short-circuit path.
  const digestsEqual = timingSafeEqual(digestA, digestB);
  const lengthsEqual = bufA.length === bufB.length;
  return (Number(digestsEqual) & Number(lengthsEqual)) === 1;
}

/** HKDF (RFC 5869) key derivation. Returns a Buffer of `length` bytes (default 32).
 * Use to derive purpose-specific subkeys from a master key. NOT for passwords —
 * use hashPassword for those. */
export function hkdf(ikm: string | Buffer, options: HkdfOptions = {}): Buffer {
  const {
    salt = Buffer.alloc(VALUE_0),
    info = Buffer.alloc(VALUE_0),
    length = 32,
    algorithm = DEFAULT_ALGORITHM,
  } = options;
  const out = hkdfSync(algorithm, toBuffer(ikm), toBuffer(salt), toBuffer(info), length);
  return Buffer.from(new Uint8Array(out));
}

/** PBKDF2 key derivation. Defaults: 600000 iterations of HMAC-SHA256 (OWASP 2026),
 * 32-byte output. Prefer hashPassword (scrypt/argon2id, memory-hard) for password
 * storage; PBKDF2 is provided for FIPS/interop requirements. */
export function pbkdf2(
  password: string | Buffer,
  salt: string | Buffer,
  options: Pbkdf2Options = {},
): Buffer {
  const { iterations = 600000, length = 32, algorithm = DEFAULT_ALGORITHM } = options;
  return pbkdf2Sync(toBuffer(password), toBuffer(salt), iterations, length, algorithm);
}

/** scrypt derivation with explicit parameters (RFC 7914). Exposed for
 * interop/testing; prefer hashPassword for password storage. */
export function scryptDerive(
  password: string | Buffer,
  salt: string | Buffer,
  keyLength: number,
  cost: number,
  blockSize: number,
  parallelism: number,
): Buffer {
  return scryptSync(toBuffer(password), toBuffer(salt), keyLength, {
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: 128 * cost * blockSize + 1024 * 1024,
  });
}

// Native argon2 (Node >= 26, OpenSSL 3.2+) — feature-detected at load time.
type Argon2SyncFn = (algorithm: string, params: Record<string, unknown>) => Buffer;
const nativeArgon2Sync: Argon2SyncFn | undefined = (
  nodeCrypto as unknown as { argon2Sync?: Argon2SyncFn }
).argon2Sync;

/** True if this Node build supports native argon2id (crypto.argon2Sync). */
export function hasArgon2(): boolean {
  return typeof nativeArgon2Sync === "function";
}

/**
 * Bounds-check KDF parameters. Used by BOTH hashPassword (where an out-of-range
 * value is programmer error) and verifyPassword (where it means the stored PHC
 * string is malformed / hostile). Keeping one definition is what makes
 * "anything hashPassword emits, verifyPassword accepts" structural rather than
 * accidental.
 */
function checkKdfParams(params: {
  saltLength?: number;
  keyLength?: number;
  scrypt?: { ln: number; r: number; p: number };
  argon2?: { m: number; t: number; p: number };
}): string | null {
  const B = KDF_BOUNDS;
  const inRange = (v: number, lo: number, hi: number): boolean =>
    Number.isInteger(v) && v >= lo && v <= hi;

  if (
    params.saltLength !== undefined &&
    !inRange(params.saltLength, B.SALT_LENGTH_MIN, B.SALT_LENGTH_MAX)
  ) {
    return `saltLength ${params.saltLength} outside [${B.SALT_LENGTH_MIN}, ${B.SALT_LENGTH_MAX}]`;
  }
  if (
    params.keyLength !== undefined &&
    !inRange(params.keyLength, B.KEY_LENGTH_MIN, B.KEY_LENGTH_MAX)
  ) {
    return `keyLength ${params.keyLength} outside [${B.KEY_LENGTH_MIN}, ${B.KEY_LENGTH_MAX}]`;
  }
  if (params.scrypt) {
    const { ln, r, p } = params.scrypt;
    if (!inRange(ln, B.SCRYPT_LN_MIN, B.SCRYPT_LN_MAX)) {
      return `scrypt ln ${ln} outside [${B.SCRYPT_LN_MIN}, ${B.SCRYPT_LN_MAX}]`;
    }
    if (!inRange(r, B.SCRYPT_R_MIN, B.SCRYPT_R_MAX)) {
      return `scrypt r ${r} outside [${B.SCRYPT_R_MIN}, ${B.SCRYPT_R_MAX}]`;
    }
    if (!inRange(p, B.SCRYPT_P_MIN, B.SCRYPT_P_MAX)) {
      return `scrypt p ${p} outside [${B.SCRYPT_P_MIN}, ${B.SCRYPT_P_MAX}]`;
    }
  }
  if (params.argon2) {
    const { m, t, p } = params.argon2;
    if (!inRange(m, B.ARGON2_M_MIN, B.ARGON2_M_MAX)) {
      return `argon2id m ${m} outside [${B.ARGON2_M_MIN}, ${B.ARGON2_M_MAX}]`;
    }
    if (!inRange(t, B.ARGON2_T_MIN, B.ARGON2_T_MAX)) {
      return `argon2id t ${t} outside [${B.ARGON2_T_MIN}, ${B.ARGON2_T_MAX}]`;
    }
    if (!inRange(p, B.ARGON2_P_MIN, B.ARGON2_P_MAX)) {
      return `argon2id p ${p} outside [${B.ARGON2_P_MIN}, ${B.ARGON2_P_MAX}]`;
    }
  }
  return null;
}

const PHC_SCRYPT_RE = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;
const PHC_ARGON2ID_RE =
  /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

const b64 = (buf: Buffer): string => buf.toString("base64").replace(/=+$/, "");
const unb64 = (s: string): Buffer => Buffer.from(s, "base64");

/** Hash a password for storage. Returns a self-describing PHC string
 * (algorithm + parameters + salt + hash), e.g.
 * `$scrypt$ln=17,r=8,p=1$<salt>$<hash>`.
 * Defaults: scrypt with N=2^17, r=8, p=1 (OWASP 2026), 16-byte salt, 32-byte key.
 * Pass { algorithm: "argon2id" } on Node >= 26 for Argon2id (m=64 MiB, t=3, p=4).
 * Verify with verifyPassword. */
export function hashPassword(password: string | Buffer, options: HashPasswordOptions = {}): string {
  const { algorithm = "scrypt", keyLength = 32, saltLength = 16 } = options;
  const salt = randomBytes(saltLength);
  if (algorithm === "argon2id") {
    if (!nativeArgon2Sync) throw new Error(ERROR_ARGON2_UNAVAILABLE);
    const memoryCost = options.memoryCost ?? 65536;
    const timeCost = options.timeCost ?? 3;
    const parallelism = options.parallelism ?? 4;
    const argonErr = checkKdfParams({
      saltLength,
      keyLength,
      argon2: { m: memoryCost, t: timeCost, p: parallelism },
    });
    if (argonErr) throw new RangeError(`${ERROR_KDF_PARAM_RANGE}: ${argonErr}`);
    const derived = nativeArgon2Sync("argon2id", {
      message: toBuffer(password),
      nonce: salt,
      parallelism,
      tagLength: keyLength,
      memory: memoryCost,
      passes: timeCost,
    });
    return `$argon2id$v=19$m=${memoryCost},t=${timeCost},p=${parallelism}$${b64(salt)}$${b64(derived)}`;
  }
  const cost = options.cost ?? 131072;
  const blockSize = options.blockSize ?? 8;
  const parallelism = options.parallelism ?? 1;
  if (cost < 2 || (cost & (cost - 1)) !== 0) throw new RangeError(ERROR_SCRYPT_COST);
  const scryptErr = checkKdfParams({
    saltLength,
    keyLength,
    scrypt: { ln: Math.log2(cost), r: blockSize, p: parallelism },
  });
  if (scryptErr) throw new RangeError(`${ERROR_KDF_PARAM_RANGE}: ${scryptErr}`);
  const derived = scryptDerive(password, salt, keyLength, cost, blockSize, parallelism);
  return `$scrypt$ln=${Math.log2(cost)},r=${blockSize},p=${parallelism}$${b64(salt)}$${b64(derived)}`;
}

/** Verify a password against a PHC string produced by hashPassword.
 * Recomputes the derivation with the stored parameters and compares in
 * constant time (safeEqual). Returns false for a wrong password; throws
 * TypeError for an unrecognized stored format (programmer error, not a
 * failed login). */
export function verifyPassword(password: string | Buffer, stored: string): boolean {
  const scryptMatch = PHC_SCRYPT_RE.exec(stored);
  if (scryptMatch) {
    const [, ln, r, p, saltB64, hashB64] = scryptMatch;
    const expected = unb64(hashB64);
    // An out-of-range parameter in a STORED string means the value is
    // malformed or hostile, so it is a format error, not a failed login.
    if (
      checkKdfParams({
        saltLength: unb64(saltB64).length,
        keyLength: expected.length,
        scrypt: { ln: Number(ln), r: Number(r), p: Number(p) },
      })
    ) {
      throw new TypeError(ERROR_PHC_FORMAT);
    }
    const derived = scryptDerive(
      password,
      unb64(saltB64),
      expected.length,
      2 ** Number(ln),
      Number(r),
      Number(p),
    );
    return safeEqual(derived, expected);
  }
  const argonMatch = PHC_ARGON2ID_RE.exec(stored);
  if (argonMatch) {
    const [, m, t, p, saltB64, hashB64] = argonMatch;
    const expected = unb64(hashB64);
    // Format validation precedes the runtime-capability check: a stored string
    // carrying out-of-range parameters is malformed whether or not this Node
    // build can compute argon2id.
    if (
      checkKdfParams({
        saltLength: unb64(saltB64).length,
        keyLength: expected.length,
        argon2: { m: Number(m), t: Number(t), p: Number(p) },
      })
    ) {
      throw new TypeError(ERROR_PHC_FORMAT);
    }
    if (!nativeArgon2Sync) throw new Error(ERROR_ARGON2_UNAVAILABLE);
    const derived = nativeArgon2Sync("argon2id", {
      message: toBuffer(password),
      nonce: unb64(saltB64),
      parallelism: Number(p),
      tagLength: expected.length,
      memory: Number(m),
      passes: Number(t),
    });
    return safeEqual(derived, expected);
  }
  throw new TypeError(ERROR_PHC_FORMAT);
}
