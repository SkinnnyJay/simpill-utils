/** Shared constants for crypto.utils (literal audit). */
export const VALUE_0 = 0;

/** randomBytesSecure: length must be non-negative integer. */
export const ERROR_RANDOM_BYTES_LENGTH =
  "randomBytesSecure: length must be a non-negative integer" as const;

/** randomIntSecure: invalid range. */
export const ERROR_RANDOM_INT_RANGE =
  "randomIntSecure: min and max must be safe integers with min < max and max - min < 2^48" as const;

/** hashPassword: argon2id requested but native crypto.argon2Sync is unavailable. */
export const ERROR_ARGON2_UNAVAILABLE =
  "hashPassword: argon2id requires Node.js >= 26 built against OpenSSL 3.2+ (crypto.argon2Sync not found); use algorithm 'scrypt' instead" as const;

/** verifyPassword: stored hash string is not in a recognized PHC format. */
export const ERROR_PHC_FORMAT =
  "verifyPassword: stored value is not a recognized PHC hash string" as const;

/** scrypt cost must be a power of 2 greater than 1. */
export const ERROR_SCRYPT_COST =
  "hashPassword: scrypt cost must be a power of 2 greater than 1" as const;

/**
 * KDF parameter bounds.
 *
 * These bound BOTH sides: hashPassword rejects out-of-range options, and
 * verifyPassword rejects a stored PHC string whose embedded parameters fall
 * outside them. Without a read-side bound, a caller verifying an
 * attacker-influenced PHC string (federated/imported credential stores,
 * multi-tenant databases, rehash endpoints) hands arbitrary cost parameters
 * straight to the KDF — e.g. `ln=30` yields maxmem ~1 TiB.
 *
 * Ranges are wide enough to admit every hash this package can produce, plus
 * generous headroom for hashes stored by earlier/other configurations.
 */
export const KDF_BOUNDS = {
  /** Salt length in bytes. */
  SALT_LENGTH_MIN: 8,
  SALT_LENGTH_MAX: 64,
  /** Derived key length in bytes. */
  KEY_LENGTH_MIN: 16,
  KEY_LENGTH_MAX: 64,
  /** scrypt log2(N). 22 => N=2^22, ~4 GiB at r=8. */
  SCRYPT_LN_MIN: 1,
  SCRYPT_LN_MAX: 22,
  /** scrypt block size r. */
  SCRYPT_R_MIN: 1,
  SCRYPT_R_MAX: 32,
  /** scrypt parallelism p. */
  SCRYPT_P_MIN: 1,
  SCRYPT_P_MAX: 16,
  /** argon2id memory in KiB. 2^21 KiB = 2 GiB. */
  ARGON2_M_MIN: 8,
  ARGON2_M_MAX: 2097152,
  /** argon2id passes t. */
  ARGON2_T_MIN: 1,
  ARGON2_T_MAX: 10,
  /** argon2id parallelism p. */
  ARGON2_P_MIN: 1,
  ARGON2_P_MAX: 16,
} as const;

/** hashPassword: a supplied KDF parameter is outside the supported range. */
export const ERROR_KDF_PARAM_RANGE = "hashPassword: KDF parameter out of range" as const;
