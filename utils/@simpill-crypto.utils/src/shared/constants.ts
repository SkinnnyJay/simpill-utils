/** Shared constants for crypto.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_16 = 16;
export const VALUE_32 = 32;
export const VALUE_80 = 80;
export const VALUE_1_5 = 1.5;

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
