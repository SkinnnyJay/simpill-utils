export type HashAlgorithm = "sha256" | "sha384" | "sha512" | "sha1";

/** Output encoding for hash/hmac digests. */
export type DigestEncoding = "hex" | "base64" | "base64url";

/** Password hashing algorithm. scrypt is built into every supported Node;
 * argon2id requires Node >= 26 (OpenSSL 3.2+) and is feature-detected. */
export type PasswordAlgorithm = "scrypt" | "argon2id";

/** Options for hashPassword. */
export interface HashPasswordOptions {
  /** Algorithm to use. Default "scrypt". */
  algorithm?: PasswordAlgorithm;
  /** scrypt: CPU/memory cost, power of 2. Default 131072 (2^17, OWASP 2026). */
  cost?: number;
  /** scrypt: block size. Default 8. */
  blockSize?: number;
  /** scrypt & argon2id: parallelism. Default 1 (scrypt) / 4 (argon2id). */
  parallelism?: number;
  /** argon2id: memory in KiB. Default 65536 (64 MiB, OWASP 2026). */
  memoryCost?: number;
  /** argon2id: passes. Default 3. */
  timeCost?: number;
  /** Derived key length in bytes. Default 32. */
  keyLength?: number;
  /** Salt length in bytes. Default 16. */
  saltLength?: number;
}

/** Options for hkdf. */
export interface HkdfOptions {
  /** Optional salt (recommended). Default: empty. */
  salt?: string | Buffer;
  /** Optional context/application info. Default: empty. */
  info?: string | Buffer;
  /** Output key length in bytes. Default 32. */
  length?: number;
  /** Digest algorithm. Default "sha256". */
  algorithm?: HashAlgorithm;
}

/** Options for pbkdf2. */
export interface Pbkdf2Options {
  /** Iteration count. Default 600000 (OWASP 2026 for SHA-256). */
  iterations?: number;
  /** Output key length in bytes. Default 32. */
  length?: number;
  /** Digest algorithm. Default "sha256". */
  algorithm?: HashAlgorithm;
}
