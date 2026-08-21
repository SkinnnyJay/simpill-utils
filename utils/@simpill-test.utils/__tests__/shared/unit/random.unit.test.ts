import {
  createSeededRandom,
  DEFAULT_ALPHABET,
  randomInt,
  randomString,
} from "../../../src/shared/random";

describe("createSeededRandom", () => {
  it("same seed produces the same sequence", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      expect(a()).toBe(b());
    }
  });

  it("different seeds produce different sequences", () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    const aVals = Array.from({ length: 10 }, () => a());
    const bVals = Array.from({ length: 10 }, () => b());
    expect(aVals).not.toEqual(bVals);
  });

  it("every value is in [0, 1) — upper bound exclusive", () => {
    const rng = createSeededRandom(7);
    for (let i = 0; i < 200000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  // REGRESSION: the previous float-LCG collapsed every seed into a single
  // shared cycle of 10,466 values (measured; intended LCG period is 2^31),
  // and different seeds merged into the SAME stream after a few thousand
  // draws (seed 424242 merged with seed 1 after 459 draws).
  it("does not repeat within 100k draws (old impl cycled after 10,466)", () => {
    const rng = createSeededRandom(1);
    const seen = new Set<number>();
    for (let i = 0; i < 100000; i++) {
      seen.add(rng());
    }
    // 32-bit outputs over 100k draws: allow a handful of birthday collisions,
    // but a 10,466-cycle would cap unique values at 10,466.
    expect(seen.size).toBeGreaterThan(99000);
  });

  it("streams from different seeds do not merge (old impl merged within ~7k draws)", () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(424242);
    const aVals = new Set<string>();
    for (let i = 0; i < 20000; i++) {
      aVals.add(`${a()}:${a()}`);
    }
    let overlap = 0;
    for (let i = 0; i < 20000; i++) {
      if (aVals.has(`${b()}:${b()}`)) {
        overlap++;
      }
    }
    expect(overlap).toBe(0);
  });

  it("accepts seed 0, negative, fractional, and huge seeds deterministically", () => {
    for (const seed of [0, -1, -42.5, 0.123, 2 ** 40, Number.MAX_SAFE_INTEGER]) {
      const a = createSeededRandom(seed);
      const b = createSeededRandom(seed);
      expect(a()).toBe(b());
      const v = a();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("nearby seeds produce unrelated streams (avalanche)", () => {
    const a = createSeededRandom(100);
    const b = createSeededRandom(101);
    let identical = 0;
    for (let i = 0; i < 100; i++) {
      if (a() === b()) {
        identical++;
      }
    }
    expect(identical).toBe(0);
  });

  it("rejects non-finite seeds", () => {
    expect(() => createSeededRandom(Number.NaN)).toThrow(RangeError);
    expect(() => createSeededRandom(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("is roughly uniform over 10 buckets", () => {
    const rng = createSeededRandom(2024);
    const buckets = new Array(10).fill(0);
    const n = 100000;
    for (let i = 0; i < n; i++) {
      buckets[Math.floor(rng() * 10)]++;
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(n / 10 - 1000);
      expect(count).toBeLessThan(n / 10 + 1000);
    }
  });
});

describe("randomInt", () => {
  it("stays within [min, max] inclusive and hits both endpoints", () => {
    const rng = createSeededRandom(5);
    const seen = new Set<number>();
    for (let i = 0; i < 10000; i++) {
      const v = randomInt(1, 6, rng);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it("min === max returns that value", () => {
    const rng = createSeededRandom(1);
    expect(randomInt(3, 3, rng)).toBe(3);
  });

  it("throws when min > max instead of returning out-of-range garbage", () => {
    const rng = createSeededRandom(1);
    expect(() => randomInt(5, 1, rng)).toThrow(RangeError);
  });

  it("throws on non-integer bounds", () => {
    const rng = createSeededRandom(1);
    expect(() => randomInt(0.5, 2, rng)).toThrow(RangeError);
    expect(() => randomInt(0, Number.NaN, rng)).toThrow(RangeError);
  });
});

describe("randomString", () => {
  it("produces only alphabet characters — never the string 'undefined'", () => {
    const rng = createSeededRandom(9);
    for (let i = 0; i < 1000; i++) {
      const s = randomString(8, rng);
      expect(s).toHaveLength(8);
      for (const ch of s) {
        expect(DEFAULT_ALPHABET).toContain(ch);
      }
    }
  });

  it("supports a custom alphabet", () => {
    const rng = createSeededRandom(3);
    const s = randomString(50, rng, "AB");
    expect(s).toMatch(/^[AB]{50}$/);
  });

  it("length 0 returns empty string", () => {
    const rng = createSeededRandom(1);
    expect(randomString(0, rng)).toBe("");
  });

  it("throws on negative/non-integer length and empty alphabet", () => {
    const rng = createSeededRandom(1);
    expect(() => randomString(-1, rng)).toThrow(RangeError);
    expect(() => randomString(1.5, rng)).toThrow(RangeError);
    expect(() => randomString(5, rng, "")).toThrow(RangeError);
  });
});
