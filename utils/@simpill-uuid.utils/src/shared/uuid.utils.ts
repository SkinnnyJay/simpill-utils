import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { VALUE_0 } from "./constants";

/**
 * RFC 9562 UUID shape: versions 1-8, variant 10x, plus NIL and MAX.
 * The `uuid` package's own validate() (v9.x) only accepts versions 1-5 and
 * silently rejects v6/v7/v8 and MAX — so validation is implemented here.
 */
const UUID_RE =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

/** RFC 9562 Nil UUID (all zero bits). */
export const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/** RFC 9562 Max UUID (all one bits). */
export const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

/* ------------------------------------------------------------------ */
/* Runtime crypto resolution (Node >= 19 / Edge / browser: global     */
/* WebCrypto; Node 16-18 CommonJS fallback via require("crypto")).    */
/* ------------------------------------------------------------------ */

type RandomFill = (bytes: Uint8Array) => Uint8Array;

interface CryptoLike {
  getRandomValues: RandomFill;
  randomUUID?: () => string;
}

function resolveCrypto(): CryptoLike {
  const g = globalThis as unknown as { crypto?: CryptoLike };
  if (g.crypto && typeof g.crypto.getRandomValues === "function") {
    const c = g.crypto;
    return {
      getRandomValues: (b) => c.getRandomValues(b),
      randomUUID: typeof c.randomUUID === "function" ? c.randomUUID.bind(c) : undefined,
    };
  }
  /* istanbul ignore next -- Node 16/18 fallback, not reachable on modern runtimes */
  const nodeCrypto = require("crypto") as {
    webcrypto: { getRandomValues: RandomFill };
    randomUUID?: () => string;
  };
  /* istanbul ignore next */
  return {
    getRandomValues: (b) => nodeCrypto.webcrypto.getRandomValues(b),
    randomUUID: nodeCrypto.randomUUID,
  };
}

const cryptoImpl = resolveCrypto();

/* Pooled entropy: one syscall refills 128 UUIDv7s' worth of random bytes. */
const RANDOM_BYTES_PER_V7 = 8;
const POOL_SIZE = RANDOM_BYTES_PER_V7 * 128;
const pool = new Uint8Array(POOL_SIZE);
let poolOffset = POOL_SIZE; // force fill on first use

function randomBytes8(): Uint8Array {
  if (poolOffset + RANDOM_BYTES_PER_V7 > POOL_SIZE) {
    cryptoImpl.getRandomValues(pool);
    poolOffset = VALUE_0;
  }
  const out = pool.subarray(poolOffset, poolOffset + RANDOM_BYTES_PER_V7);
  poolOffset += RANDOM_BYTES_PER_V7;
  return out;
}

/* Hex stringify via lookup table (fastest known pure-JS approach). */
const byteToHex: string[] = [];
for (let i = 0; i < 256; i++) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function stringifyBytes(b: Uint8Array): string {
  return `${byteToHex[b[0]]}${byteToHex[b[1]]}${byteToHex[b[2]]}${byteToHex[b[3]]}-${byteToHex[b[4]]}${byteToHex[b[5]]}-${byteToHex[b[6]]}${byteToHex[b[7]]}-${byteToHex[b[8]]}${byteToHex[b[9]]}-${byteToHex[b[10]]}${byteToHex[b[11]]}${byteToHex[b[12]]}${byteToHex[b[13]]}${byteToHex[b[14]]}${byteToHex[b[15]]}`;
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

/** RFC 9562 v4 (random) UUID. Uses native crypto.randomUUID when available (faster). */
export function generateUUID(): string {
  return cryptoImpl.randomUUID ? cryptoImpl.randomUUID() : uuidv4();
}

/** Alias for generateUUID (v4). */
export function generateUUIDv4(): string {
  return generateUUID();
}

/** RFC 9562 v1 (time-based) UUID. */
export function generateUUIDv1(): string {
  return uuidv1();
}

/** RFC 9562 v5 (namespace + name, SHA-1). Use NAMESPACE_DNS etc. from uuid for namespace. */
export function generateUUIDv5(name: string, namespace: string): string {
  return uuidv5(name, namespace);
}

/*
 * UUIDv7 monotonic state (RFC 9562 Section 6.2, Method 1: fixed bit-length
 * dedicated counter). The 12-bit rand_a field is a counter, seeded with
 * 11 random bits on every new millisecond tick (the spare MSB guarantees
 * >= 2048 increments of headroom per tick). Within the same tick the
 * counter increments; on the extraordinarily rare overflow the timestamp
 * is advanced by 1 ms (permitted by Section 6.1) and the counter reseeds.
 * A backwards system clock pins the timestamp to the last value seen, so
 * output order never regresses (Section 6.3 guidance).
 */
const V7_COUNTER_MASK = 0xfff;
const V7_COUNTER_SEED_BITS = 0x800; // seed in [0, 0x800)
let v7LastTimestamp = -1;
let v7Counter = 0;

function seedV7Counter(): number {
  const seed = randomBytes8();
  return ((seed[0] << 8) | seed[1]) % V7_COUNTER_SEED_BITS;
}

/** RFC 9562 v7 (Unix-time-ordered) UUID with per-process monotonicity guarantee. */
export function generateUUIDv7(): string {
  let ts = Date.now();
  if (ts <= v7LastTimestamp) {
    // Same tick or backwards clock: pin timestamp, advance counter.
    ts = v7LastTimestamp;
    v7Counter = (v7Counter + 1) & V7_COUNTER_MASK;
    if (v7Counter === VALUE_0) {
      // Counter exhausted within one tick: borrow the next millisecond.
      ts += 1;
      v7Counter = seedV7Counter();
    }
  } else {
    v7Counter = seedV7Counter();
  }
  v7LastTimestamp = ts;

  const b = new Uint8Array(16);
  // 48-bit big-endian Unix millisecond timestamp.
  b[0] = (ts / 2 ** 40) & 0xff;
  b[1] = (ts / 2 ** 32) & 0xff;
  b[2] = (ts / 2 ** 24) & 0xff;
  b[3] = (ts / 2 ** 16) & 0xff;
  b[4] = (ts / 2 ** 8) & 0xff;
  b[5] = ts & 0xff;
  // Version 7 + 12-bit counter in rand_a.
  b[6] = 0x70 | ((v7Counter >> 8) & 0x0f);
  b[7] = v7Counter & 0xff;
  // Variant 10x + 62 random bits in rand_b.
  const r = randomBytes8();
  b[8] = (r[0] & 0x3f) | 0x80;
  b[9] = r[1];
  b[10] = r[2];
  b[11] = r[3];
  b[12] = r[4];
  b[13] = r[5];
  b[14] = r[6];
  b[15] = r[7];
  return stringifyBytes(b);
}

/* ------------------------------------------------------------------ */
/* Validation & inspection                                             */
/* ------------------------------------------------------------------ */

/** True if string is a valid RFC 9562 UUID (versions 1-8, plus Nil and Max). */
export function validateUUID(uuid: string): boolean {
  return typeof uuid === "string" && UUID_RE.test(uuid);
}

/** Alias for validateUUID. */
export function isUUID(uuid: string): boolean {
  return validateUUID(uuid);
}

/** True if string is a valid RFC 9562 v7 UUID. */
export function isUUIDv7(uuid: string): boolean {
  return uuidVersion(uuid) === 7;
}

/** RFC 9562 version number (1-8) of a valid UUID; 0 for Nil/Max; null if invalid. */
export function uuidVersion(uuid: string): number | null {
  if (!validateUUID(uuid)) return null;
  if (uuid === NIL_UUID || uuid.toLowerCase() === MAX_UUID) return VALUE_0;
  return Number.parseInt(uuid.charAt(14), 16);
}

/** Unix millisecond timestamp embedded in a v7 UUID; null if not a valid v7. */
export function getUUIDv7Timestamp(uuid: string): number | null {
  if (!isUUIDv7(uuid)) return null;
  const hex = uuid.slice(0, 8) + uuid.slice(9, 13);
  return Number.parseInt(hex, 16);
}

/** Returns string if valid UUID, else null (parse + validate in one call). */
export function parseUUID(value: string): string | null {
  if (typeof value !== "string" || value.length === VALUE_0) return null;
  return validateUUID(value) ? value : null;
}

/** Lowercase canonical form of a valid UUID (RFC 9562 Section 4), else null. */
export function normalizeUUID(value: string): string | null {
  const parsed = parseUUID(value);
  return parsed === null ? null : parsed.toLowerCase();
}

/**
 * True if two UUID strings identify the same UUID. Comparison is
 * case-insensitive per RFC 9562 Section 4 (hex digits carry no case
 * semantics); previously this was a case-sensitive === which reported
 * false for equal UUIDs differing only in case.
 */
export function compareUUIDs(uuid1: string, uuid2: string): boolean {
  if (uuid1 === uuid2) return true;
  return (
    typeof uuid1 === "string" &&
    typeof uuid2 === "string" &&
    uuid1.toLowerCase() === uuid2.toLowerCase()
  );
}

export const UUIDHelper = {
  generateUUID,
  generateUUIDv1,
  generateUUIDv4,
  generateUUIDv5,
  generateUUIDv7,
  getUUIDv7Timestamp,
  isUUID,
  isUUIDv7,
  normalizeUUID,
  parseUUID,
  compareUUIDs,
  uuidVersion,
  validateUUID,
  NIL_UUID,
  MAX_UUID,
} as const;
