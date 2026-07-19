import {
  approxEqual,
  avg,
  clamp,
  inverseLerp,
  lerp,
  randomInt,
  remap,
  roundTo,
  sum,
  sumPrecise,
  toFloat,
  toInt,
} from "../../../src/shared/number.utils";

/** Deterministic LCG so property tests are reproducible. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe("roundTo (exponent-shift rounding)", () => {
  it("rounds decimal-halfway values the way they read", () => {
    // multiply-divide idiom fails all of these (1.005*100 === 100.49999...)
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(0.145, 2)).toBe(0.15);
    expect(roundTo(10.075, 2)).toBe(10.08);
    expect(roundTo(2.675, 2)).toBe(2.68);
  });

  it("keeps original behavior for non-halfway values", () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
    expect(roundTo(7, 0)).toBe(7);
    expect(roundTo(-1.2345, 3)).toBe(-1.234);
  });

  it("supports negative decimals (tens, hundreds)", () => {
    expect(roundTo(4560, -2)).toBe(4600);
    expect(roundTo(4549, -2)).toBe(4500);
    expect(roundTo(-4560, -3)).toBe(-5000);
  });

  it("half-even (banker's) mode", () => {
    expect(roundTo(0.5, 0, { mode: "half-even" })).toBe(0);
    expect(roundTo(1.5, 0, { mode: "half-even" })).toBe(2);
    expect(roundTo(2.5, 0, { mode: "half-even" })).toBe(2);
    expect(roundTo(-2.5, 0, { mode: "half-even" })).toBe(-2);
    expect(roundTo(-3.5, 0, { mode: "half-even" })).toBe(-4);
    expect(roundTo(0.125, 2, { mode: "half-even" })).toBe(0.12);
    expect(roundTo(0.135, 2, { mode: "half-even" })).toBe(0.14);
  });

  it("non-finite values pass through", () => {
    expect(roundTo(Number.NaN, 2)).toBeNaN();
    expect(roundTo(Number.POSITIVE_INFINITY, 2)).toBe(Number.POSITIVE_INFINITY);
  });

  it("fast path always agrees with the exact decimal shift (property)", () => {
    // reference: pure string-exponent shift, no fast path
    const exactRound = (value: number, places: number): number => {
      const shift = (v: number, by: number): number => {
        const [m, e = "0"] = `${v}e`.split("e");
        return Number(`${m}e${Number(e) + by}`);
      };
      const r = shift(Math.round(shift(value, places)), -places);
      return r === 0 && value < 0 ? -0 : r; // Math.round signed-zero semantics
    };
    const rng = makeRng(0xbeef);
    for (let i = 0; i < 5000; i++) {
      const value = (rng() * 2 - 1) * 10 ** Math.floor(rng() * 12 - 3);
      const places = Math.floor(rng() * 9);
      expect(roundTo(value, places)).toBe(exactRound(value, places));
    }
  });

  it("scientific-notation magnitudes survive the shift", () => {
    expect(roundTo(1.25e21, 0)).toBe(1.25e21);
    expect(roundTo(1e-7, 2)).toBe(0);
  });
});

describe("toInt / toFloat (coercion holes closed)", () => {
  it("empty and whitespace strings hit the fallback (Number('') === 0 bug)", () => {
    expect(toInt("", 99)).toBe(99);
    expect(toInt("   ", 99)).toBe(99);
    expect(toFloat("", 99)).toBe(99);
  });

  it("null, arrays, booleans and objects hit the fallback", () => {
    expect(toInt(null, 99)).toBe(99);
    expect(toInt([], 99)).toBe(99);
    expect(toInt([5], 99)).toBe(99);
    expect(toInt(true, 99)).toBe(99);
    expect(toInt({}, 99)).toBe(99);
    expect(toInt(undefined, 99)).toBe(99);
    expect(toFloat(null, 99)).toBe(99);
    expect(toFloat(false, 99)).toBe(99);
  });

  it("symbols no longer throw (Number(Symbol()) throws TypeError)", () => {
    expect(toInt(Symbol("x"), 7)).toBe(7);
    expect(toFloat(Symbol("x"), 7)).toBe(7);
  });

  it("truncates toward zero like parseInt (floor gave -4 for -3.7)", () => {
    expect(toInt(-3.7)).toBe(-3);
    expect(toInt(3.7)).toBe(3);
    expect(toInt("-3.7")).toBe(-3);
  });

  it("accepts exact bigints, rejects lossy ones", () => {
    expect(toInt(42n)).toBe(42);
    expect(toFloat(-7n)).toBe(-7);
    expect(toInt(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
    expect(toInt(2n ** 60n + 1n, 99)).toBe(99); // cannot round-trip
  });

  it("still parses numeric strings with whitespace", () => {
    expect(toInt(" 42 ")).toBe(42);
    expect(toFloat(" 3.14 ")).toBe(3.14);
    expect(toFloat("1e3")).toBe(1000);
  });
});

describe("clamp (TC39 Math.clamp semantics)", () => {
  it("propagates NaN instead of leaking it through comparisons", () => {
    expect(clamp(Number.NaN, 0, 10)).toBeNaN();
    expect(clamp(5, Number.NaN, 10)).toBeNaN();
    expect(clamp(5, 0, Number.NaN)).toBeNaN();
  });

  it("throws RangeError when min > max (was: silently returned min)", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });

  it("treats -0 and 0 as equal bounds (no throw)", () => {
    expect(clamp(1, -0, 0)).toBe(0);
  });

  it("supports one-sided bounds via infinities", () => {
    expect(clamp(5, 0, Number.POSITIVE_INFINITY)).toBe(5);
    expect(clamp(-5, Number.NEGATIVE_INFINITY, 10)).toBe(-5);
  });
});

describe("lerp (C++20 std::lerp / P0811R3 guarantees)", () => {
  const rng = makeRng(0xc0ffee);
  const randSigned = (mag: number) => (rng() * 2 - 1) * mag;

  it("is exact at t=0 and t=1 for random finite endpoints", () => {
    for (let i = 0; i < 2000; i++) {
      const a = randSigned(10 ** Math.floor(rng() * 17));
      const b = randSigned(10 ** Math.floor(rng() * 17));
      expect(lerp(a, b, 0)).toBe(a);
      expect(lerp(a, b, 1)).toBe(b); // a + (b-a)*1 is NOT exact in general
    }
  });

  it("a + (b-a)*t form fails exactness at t=1 (documenting the old bug)", () => {
    const a = 1e16 + 2;
    const b = 3.5;
    expect(a + (b - a) * 1).not.toBe(b); // old implementation
    expect(lerp(a, b, 1)).toBe(b);
  });

  it("is consistent: lerp(a, a, t) === a", () => {
    for (let i = 0; i < 500; i++) {
      const a = randSigned(1e12);
      const t = randSigned(3);
      expect(lerp(a, a, t)).toBe(a);
    }
  });

  it("is bounded for t in [0, 1]", () => {
    for (let i = 0; i < 2000; i++) {
      const a = randSigned(1e9);
      const b = randSigned(1e9);
      const t = rng();
      const r = lerp(a, b, t);
      expect(r).toBeGreaterThanOrEqual(Math.min(a, b));
      expect(r).toBeLessThanOrEqual(Math.max(a, b));
    }
  });

  it("does not overflow on large opposite-sign spans", () => {
    expect(lerp(-1e308, 1e308, 1)).toBe(1e308);
    expect(lerp(-1e308, 1e308, 0.5)).toBe(0);
  });
});

describe("inverseLerp / remap", () => {
  it("inverts lerp", () => {
    expect(inverseLerp(0, 10, 5)).toBe(0.5);
    expect(inverseLerp(10, 20, 10)).toBe(0);
    expect(inverseLerp(10, 20, 20)).toBe(1);
    expect(inverseLerp(20, 10, 15)).toBe(0.5); // reversed range
  });

  it("returns 0 for degenerate range (Unity convention)", () => {
    expect(inverseLerp(5, 5, 123)).toBe(0);
  });

  it("remap maps between ranges (TC39 Math.scale)", () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(0, -1, 1, 0, 10)).toBe(5);
    expect(remap(0.5, 0, 1, 100, 200)).toBe(150);
  });

  it("round-trip property: remap there and back", () => {
    const rng = makeRng(42);
    for (let i = 0; i < 500; i++) {
      const v = rng() * 100;
      const out = remap(v, 0, 100, -1, 1);
      const back = remap(out, -1, 1, 0, 100);
      expect(approxEqual(back, v, { relTol: 1e-12, absTol: 1e-9 })).toBe(true);
    }
  });
});

describe("approxEqual (PEP 485 math.isclose semantics)", () => {
  it("classic float traps", () => {
    expect(0.1 + 0.2 === 0.3).toBe(false);
    expect(approxEqual(0.1 + 0.2, 0.3)).toBe(true);
  });

  it("relative tolerance scales with magnitude", () => {
    expect(approxEqual(1e10, 1e10 + 1, { relTol: 1e-9 })).toBe(true);
    expect(approxEqual(1, 1.1, { relTol: 1e-9 })).toBe(false);
  });

  it("absTol handles comparisons against zero (relTol alone cannot)", () => {
    expect(approxEqual(1e-12, 0)).toBe(false);
    expect(approxEqual(1e-12, 0, { absTol: 1e-9 })).toBe(true);
  });

  it("NaN is never close; infinities only equal themselves", () => {
    expect(approxEqual(Number.NaN, Number.NaN)).toBe(false);
    expect(approxEqual(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)).toBe(true);
    expect(approxEqual(Number.POSITIVE_INFINITY, Number.MAX_VALUE)).toBe(false);
  });

  it("rejects negative tolerances", () => {
    expect(() => approxEqual(1, 1, { relTol: -1 })).toThrow(RangeError);
  });
});

describe("sum (Neumaier compensated)", () => {
  it("fixes the textbook accumulation errors", () => {
    expect(sum(Array(10).fill(0.1))).toBe(1);
    expect(sum([1e100, 1, -1e100])).toBe(1); // naive reduce returns 0
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });

  it("avg inherits the accuracy", () => {
    expect(avg(Array(10).fill(0.1))).toBe(0.1);
    expect(avg([])).toBe(0);
  });
});

describe("sumPrecise (ES2026 Math.sumPrecise semantics)", () => {
  it("proposal vectors", () => {
    expect(sumPrecise([1e20, 0.1, -1e20])).toBe(0.1);
    expect(sumPrecise([1e100, 1, -1e100])).toBe(1);
  });

  it("empty iterable returns -0 (the float additive identity)", () => {
    expect(Object.is(sumPrecise([]), -0)).toBe(true);
  });

  it("zero-sign arithmetic follows IEEE754", () => {
    expect(Object.is(sumPrecise([-0]), -0)).toBe(true);
    expect(Object.is(sumPrecise([-0, -0]), -0)).toBe(true);
    expect(Object.is(sumPrecise([-0, 0]), 0)).toBe(true);
    expect(Object.is(sumPrecise([0]), 0)).toBe(true);
  });

  it("NaN and infinity handling", () => {
    expect(sumPrecise([1, Number.NaN])).toBeNaN();
    expect(sumPrecise([Number.POSITIVE_INFINITY, 1])).toBe(Number.POSITIVE_INFINITY);
    expect(sumPrecise([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])).toBeNaN();
  });

  it("rejects non-number values with TypeError (spec behavior)", () => {
    expect(() => sumPrecise([1, "2" as unknown as number])).toThrow(TypeError);
    expect(() => sumPrecise([1n as unknown as number])).toThrow(TypeError);
  });

  it("accepts any iterable", () => {
    expect(sumPrecise(new Set([1, 2, 3]))).toBe(6);
  });

  it("is correctly rounded vs an exact BigInt oracle (naive sum is not)", () => {
    const rng = makeRng(0xdead);
    const SCALE = 2 ** -30;
    let naiveEverWrong = false;
    for (let trial = 0; trial < 50; trial++) {
      const n = 200 + Math.floor(rng() * 800);
      const values: number[] = [];
      let exact = 0n;
      for (let i = 0; i < n; i++) {
        // m fits in 53 bits with dense low bits (two 32-bit draws), so
        // m * 2^-30 is an exact double and naive summation loses precision
        const hi = BigInt(Math.floor(rng() * 2 ** 21));
        const lo = BigInt(Math.floor(rng() * 2 ** 32));
        const m = (rng() < 0.5 ? -1n : 1n) * (hi * 2n ** 32n + lo);
        exact += m;
        values.push(Number(m) * SCALE);
      }
      // Number(BigInt) rounds ties-to-even; scaling by 2^-30 is exact
      const expected = Number(exact) * SCALE;
      expect(sumPrecise(values)).toBe(expected);
      if (values.reduce((acc, v) => acc + v, 0) !== expected) naiveEverWrong = true;
    }
    expect(naiveEverWrong).toBe(true); // the oracle has teeth
  });
});

describe("randomInt (validated bounds)", () => {
  it("throws RangeError on reversed bounds (was: silent out-of-range values)", () => {
    expect(() => randomInt(5, 1)).toThrow(RangeError);
  });

  it("throws RangeError when no integers exist in the range", () => {
    expect(() => randomInt(2.1, 2.9)).toThrow(RangeError);
  });

  it("throws TypeError on non-finite bounds", () => {
    expect(() => randomInt(Number.NaN, 5)).toThrow(TypeError);
    expect(() => randomInt(0, Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it("stays in range, including single-integer ranges", () => {
    for (let i = 0; i < 200; i++) {
      const n = randomInt(-3, 3);
      expect(n).toBeGreaterThanOrEqual(-3);
      expect(n).toBeLessThanOrEqual(3);
      expect(Number.isInteger(n)).toBe(true);
    }
    expect(randomInt(2.1, 3.9)).toBe(3);
  });
});
