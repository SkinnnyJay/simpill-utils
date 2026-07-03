/**
 * Deterministic RNG for reproducible tests.
 *
 * Implementation: mulberry32 (32-bit state, Math.imul exact 32-bit arithmetic).
 * Chosen because it is the standard high-quality 32-bit JS PRNG: full 2^32
 * period, passes gjrand, and returns values in [0, 1) — never 1.0.
 *
 * Why not the previous LCG transcription: `seed * 1103515245` exceeds 2^53
 * once the state grows, so IEEE-754 rounding silently changes the recurrence.
 * The result was NOT the glibc LCG its constants promise — measured behavior:
 * every seed collapses into one shared cycle of just 10,466 values (the real
 * LCG's period is 2^31), and "independent" seeds merge into the SAME stream
 * after a few thousand draws (seed 424242 merged with seed 1 after 459 draws).
 */

/** Scramble an arbitrary finite number (negative, fractional, huge) into a 32-bit seed. */
function mixSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new RangeError(`createSeededRandom: seed must be a finite number, got ${seed}`);
  }
  // Fold the full float (integer and fractional parts) into 32 bits.
  let h = seed >>> 0;
  const frac = seed - Math.trunc(seed);
  if (frac !== 0) {
    h = (h ^ Math.imul((frac * 0x100000000) >>> 0, 0x9e3779b9)) >>> 0;
  }
  const hi = Math.floor(Math.abs(seed) / 0x100000000);
  if (hi > 0) {
    h = (h ^ Math.imul(hi >>> 0, 0x85ebca6b)) >>> 0;
  }
  if (seed < 0) {
    h = (h ^ 0x5bd1e995) >>> 0;
  }
  // splitmix32-style avalanche so nearby seeds produce unrelated streams.
  h = (h + 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h = (h ^ (h >>> 15)) >>> 0;
  return h;
}

/**
 * Create a deterministic RNG. Same seed => same sequence, on every JS engine.
 * Returns values in [0, 1) — the upper bound is exclusive, like Math.random().
 */
export function createSeededRandom(seed: number): () => number {
  let a = mixSeed(seed);
  return (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Deterministic string of `length` characters drawn from `alphabet`
 * (defaults to lowercase alphanumerics). rng values are guaranteed in
 * [0, 1) so every index is in range — no "undefined" in the output.
 */
export function randomString(
  length: number,
  rng: () => number,
  alphabet: string = DEFAULT_ALPHABET,
): string {
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError(`randomString: length must be a non-negative integer, got ${length}`);
  }
  if (alphabet.length === 0) {
    throw new RangeError("randomString: alphabet must not be empty");
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(rng() * alphabet.length)];
  }
  return out;
}

/**
 * Deterministic integer in [min, max] (both inclusive).
 * Throws RangeError if min > max or bounds are not finite integers.
 */
export function randomInt(min: number, max: number, rng: () => number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError(`randomInt: min and max must be integers, got min=${min}, max=${max}`);
  }
  if (min > max) {
    throw new RangeError(`randomInt: min (${min}) must be <= max (${max})`);
  }
  return Math.floor(rng() * (max - min + 1)) + min;
}
