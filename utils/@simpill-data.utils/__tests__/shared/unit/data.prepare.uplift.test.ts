import {
  coerceBoolean,
  coerceNumber,
  sanitizeForJson,
  withDefaults,
} from "../../../src/shared/data.prepare";

describe("coerceNumber uplift", () => {
  it("empty/whitespace strings return fallback (frozen: Number('') === 0)", () => {
    expect(coerceNumber("", 42)).toBe(42);
    expect(coerceNumber("   ", 42)).toBe(42);
  });

  it("non-string/number garbage returns fallback (frozen: null->0, []->0, true->1)", () => {
    expect(coerceNumber(null, 42)).toBe(42);
    expect(coerceNumber(undefined, 42)).toBe(42);
    expect(coerceNumber([], 42)).toBe(42);
    expect(coerceNumber([5], 42)).toBe(42);
    expect(coerceNumber(true, 42)).toBe(42);
    expect(coerceNumber({}, 42)).toBe(42);
  });

  it("numeric strings are trimmed and parsed", () => {
    expect(coerceNumber(" 3.5 ", 0)).toBe(3.5);
    expect(coerceNumber("-7", 0)).toBe(-7);
    expect(coerceNumber("abc", 9)).toBe(9);
  });

  it("finite numbers pass; NaN/Infinity fall back", () => {
    expect(coerceNumber(2, 0)).toBe(2);
    expect(coerceNumber(Number.NaN, 5)).toBe(5);
    expect(coerceNumber(Number.POSITIVE_INFINITY, 5)).toBe(5);
  });

  it("bigints convert only when exactly representable", () => {
    expect(coerceNumber(10n, 0)).toBe(10);
    expect(coerceNumber(2n ** 60n, 7)).toBe(7);
  });
});

describe("coerceBoolean uplift", () => {
  it('recognizes "1"/"0" strings (frozen returned the fallback)', () => {
    expect(coerceBoolean("1", false)).toBe(true);
    expect(coerceBoolean("0", true)).toBe(false);
  });

  it("recognizes yes/no, y/n, on/off, case-insensitive, trimmed", () => {
    expect(coerceBoolean("yes", false)).toBe(true);
    expect(coerceBoolean(" ON ", false)).toBe(true);
    expect(coerceBoolean("TRUE", false)).toBe(true);
    expect(coerceBoolean("No", true)).toBe(false);
    expect(coerceBoolean("off", true)).toBe(false);
    expect(coerceBoolean("n", true)).toBe(false);
  });

  it("unrecognized strings and numbers fall back", () => {
    expect(coerceBoolean("banana", true)).toBe(true);
    expect(coerceBoolean("banana", false)).toBe(false);
    expect(coerceBoolean(2, true)).toBe(true);
  });

  it("original behavior preserved: booleans, number 1/0, exact true/false strings", () => {
    expect(coerceBoolean(true, false)).toBe(true);
    expect(coerceBoolean(false, true)).toBe(false);
    expect(coerceBoolean(1, false)).toBe(true);
    expect(coerceBoolean(0, true)).toBe(false);
    expect(coerceBoolean("true", false)).toBe(true);
    expect(coerceBoolean("false", true)).toBe(false);
  });
});

describe("withDefaults uplift", () => {
  it("explicit undefined in base no longer clobbers defaults", () => {
    expect(withDefaults({ a: undefined as number | undefined }, { a: 1 })).toEqual({ a: 1 });
  });

  it("defined base values still win", () => {
    expect(withDefaults({ a: 0 }, { a: 1 })).toEqual({ a: 0 });
    expect(withDefaults({ a: null as unknown as number }, { a: 1 })).toEqual({ a: null });
  });

  it("original merge behavior preserved", () => {
    const base: Partial<{ a: number; b: number }> = { a: 1 };
    expect(withDefaults(base, { a: 9, b: 2 })).toEqual({ a: 1, b: 2 });
  });
});

describe("sanitizeForJson uplift", () => {
  it("circular input returns [Circular] instead of crashing (frozen threw RangeError)", () => {
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    const out = sanitizeForJson(a) as Record<string, unknown>;
    expect(out.x).toBe(1);
    expect(out.self).toBe("[Circular]");
    expect(() => JSON.stringify(out)).not.toThrow();
  });

  it("Dates survive as ISO strings (frozen destroyed them to {})", () => {
    const out = sanitizeForJson({ when: new Date("2026-01-01T00:00:00.000Z") });
    expect(out.when as unknown).toBe("2026-01-01T00:00:00.000Z");
  });

  it("Map -> object, Set -> array (frozen destroyed both to {})", () => {
    const out = sanitizeForJson({ m: new Map([["k", 1]]), s: new Set([1, 2]) }) as unknown as {
      m: Record<string, unknown>;
      s: unknown[];
    };
    expect(out.m).toEqual({ k: 1 });
    expect(out.s).toEqual([1, 2]);
  });

  it("bigint -> string (JSON.stringify on frozen output threw)", () => {
    const out = sanitizeForJson({ big: 10n }) as unknown as { big: string };
    expect(out.big).toBe("10");
    expect(() => JSON.stringify(out)).not.toThrow();
  });

  it("NaN/Infinity -> null; functions/symbols/undefined dropped in objects, null in arrays", () => {
    const out = sanitizeForJson({
      nan: Number.NaN,
      inf: Number.POSITIVE_INFINITY,
      fn: () => 1,
      sym: Symbol("x"),
      undef: undefined,
      arr: [() => 1, undefined, 2],
    }) as unknown as Record<string, unknown>;
    expect(out.nan).toBeNull();
    expect(out.inf).toBeNull();
    expect("fn" in out).toBe(false);
    expect("sym" in out).toBe(false);
    expect("undef" in out).toBe(false);
    expect(out.arr).toEqual([null, null, 2]);
  });

  it("honors toJSON and survives a throwing toJSON", () => {
    const custom = { toJSON: () => ({ replaced: true }) };
    expect(sanitizeForJson({ custom }).custom as unknown).toEqual({ replaced: true });

    const hostile = {
      toJSON: () => {
        throw new Error("boom");
      },
      keep: 1,
    };
    const out = sanitizeForJson({ hostile }) as unknown as { hostile: { keep: number } };
    expect(out.hostile.keep).toBe(1);
    expect(() => JSON.stringify(out)).not.toThrow();
  });

  it("property: JSON.stringify never throws across hostile inputs", () => {
    const cyc: Record<string, unknown> = {};
    cyc.self = cyc;
    const deepCyc = { a: { b: [] as unknown[] } };
    deepCyc.a.b.push(deepCyc);
    const hostiles: unknown[] = [
      cyc,
      deepCyc,
      { big: 2n ** 80n },
      new Map<unknown, unknown>([[{ k: 1 }, new Set([1n])]]),
      [Symbol("s"), () => 1, undefined, Number.NaN],
      { toJSON: () => undefined },
      { nested: { d: new Date(), m: new Map([["x", Number.POSITIVE_INFINITY]]) } },
    ];
    for (const h of hostiles) {
      expect(() => JSON.stringify(sanitizeForJson(h))).not.toThrow();
    }
  });

  it("property: parity with JSON.stringify round-trip on JSON-safe values", () => {
    const values: unknown[] = [
      { a: 1, b: [1, "x", null, true], c: { d: {} } },
      [1, 2, 3],
      "str",
      42,
      null,
      { when: new Date("2026-06-01T12:00:00Z"), n: [Number.NaN] },
    ];
    for (const v of values) {
      expect(JSON.parse(JSON.stringify(sanitizeForJson(v)))).toEqual(JSON.parse(JSON.stringify(v)));
    }
  });
});
