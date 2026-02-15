/**
 * Basic crypto utilities using Node.js crypto module.
 * Server/Node only.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { HashAlgorithm } from "../shared";
import { ERROR_RANDOM_BYTES_LENGTH, VALUE_0 } from "../shared/constants";

const DEFAULT_ALGORITHM: HashAlgorithm = "sha256";

/** Hash input to hex (default sha256). Strings UTF-8 encoded. */
export function hash(data: string | Buffer, algorithm: HashAlgorithm = DEFAULT_ALGORITHM): string {
  const input = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return createHash(algorithm).update(input).digest("hex");
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

/** Constant-time comparison; returns false if lengths differ (avoids leaking length). */
export function timingSafeEqualBuffer(a: Buffer | string, b: Buffer | string): boolean {
  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(a, "utf8");
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
