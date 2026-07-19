/**
 * Lumen Industries uplift tests: bug fixes + new primitives.
 * Baseline suite (primitive-helpers.unit.test.ts) is untouched.
 */
import {
  assert,
  assertDefined,
  assertNever,
  coalesce,
  isDefined,
  noop,
  parseJsonSafe,
  toBoolean,
  toggle,
  toJsonSafe,
} from "../../../src/shared/primitive-helpers";

describe("primitive-helpers (uplift)", () => {
  describe("toJsonSafe never returns undefined (bug fix)", () => {
    it("returns fallback for functions (JSON.stringify -> undefined, no throw)", () => {
      expect(toJsonSafe(() => 1, "FB")).toBe("FB");
    });
    it("returns fallback for symbols", () => {
      expect(toJsonSafe(Symbol("x"), "FB")).toBe("FB");
    });
    it("returns fallback for top-level undefined", () => {
      expect(toJsonSafe(undefined, "FB")).toBe("FB");
    });
    it("returns fallback for BigInt (throws)", () => {
      expect(toJsonSafe(BigInt(1), "FB")).toBe("FB");
    });
    it("returns fallback for circular structures (throws)", () => {
      const c: unknown[] = [];
      c.push(c);
      expect(toJsonSafe(c, "FB")).toBe("FB");
    });
    it("property: output is always a string for arbitrary inputs", () => {
      const inputs: unknown[] = [
        undefined,
        null,
        0,
        -0,
        1,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        "",
        "x",
        true,
        false,
        [],
        {},
        { a: [1, "b", null] },
        () => 1,
        Symbol("s"),
        BigInt(9),
        new Date(0),
        new Map(),
        new Set(),
        { toJSON: () => undefined },
        [undefined, () => 1, Symbol("s")],
      ];
      for (const v of inputs) {
        const out = toJsonSafe(v, "FB");
        expect(typeof out).toBe("string");
      }
    });
    it("valid values still round-trip through parseJsonSafe", () => {
      const values = [{ a: 1 }, [1, 2, 3], "str", 42, true, null];
      for (const v of values) {
        expect(parseJsonSafe(toJsonSafe(v, "FB"), "MISS")).toEqual(v);
      }
    });
  });

  describe("toBoolean number semantics (bug fix)", () => {
    it("Infinity is truthy like Boolean()", () => {
      expect(toBoolean(Number.POSITIVE_INFINITY)).toBe(true);
      expect(toBoolean(Number.NEGATIVE_INFINITY)).toBe(true);
    });
    it("0, -0, NaN remain false", () => {
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(-0)).toBe(false);
      expect(toBoolean(Number.NaN)).toBe(false);
    });
  });

  describe("toBoolean extended default sets (yn convention)", () => {
    it.each([
      ["y"],
      ["Y"],
      ["on"],
      ["ON"],
      [" on "],
      ["yes"],
      ["1"],
      ["true"],
    ])("%p is truthy", (s) => {
      expect(toBoolean(s)).toBe(true);
    });
    it.each([
      ["n"],
      ["N"],
      ["off"],
      ["OFF"],
      [" off "],
      ["no"],
      ["0"],
      ["false"],
      [""],
    ])("%p is falsy", (s) => {
      expect(toBoolean(s)).toBe(false);
    });
    it("unmatched strings still fall to default", () => {
      expect(toBoolean("banana")).toBe(false);
      expect(toBoolean("banana", { default: true })).toBe(true);
    });
    it("custom lists still override defaults, case-insensitively", () => {
      expect(toBoolean("Ja", { truthy: ["ja"] })).toBe(true);
      expect(toBoolean("NEIN", { falsy: ["nein"] })).toBe(false);
      // custom truthy replaces the default truthy list entirely
      expect(toBoolean("true", { truthy: ["ja"] })).toBe(false);
    });
  });

  describe("toggle documented behavior", () => {
    it("returns !(value ?? fallback)", () => {
      expect(toggle(undefined)).toBe(true);
      expect(toggle(undefined, true)).toBe(false);
      expect(toggle(true)).toBe(false);
      expect(toggle(false)).toBe(true);
    });
  });

  describe("assert truthiness + lazy message (tiny-invariant convention)", () => {
    it("narrows arbitrary truthy values, not only booleans", () => {
      const maybe: string | undefined = "x" as string | undefined;
      assert(maybe);
      // type-narrowed here: no optional chaining needed
      expect(maybe.length).toBe(1);
      expect(() => assert("")).toThrow("Assertion failed");
      expect(() => assert(0)).toThrow("Assertion failed");
      expect(() => assert(null)).toThrow("Assertion failed");
    });
    it("lazy message only built on failure", () => {
      const spy = jest.fn(() => "expensive");
      assert(true, spy);
      expect(spy).not.toHaveBeenCalled();
      expect(() => assert(false, spy)).toThrow("expensive");
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("isDefined / assertDefined / assertNever / noop (new)", () => {
    it("isDefined narrows out null and undefined only", () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
      const arr = [1, null, 2, undefined, 3].filter(isDefined);
      const total: number = arr.reduce((a, b) => a + b, 0); // type check: number[]
      expect(total).toBe(6);
    });
    it("isDefined agrees with coalesce", () => {
      expect(coalesce(null, undefined, 5)).toBe(5);
      expect(isDefined(coalesce(null, undefined, 5))).toBe(true);
      expect(isDefined(coalesce<number>(null, undefined))).toBe(false);
    });
    it("assertDefined throws on null/undefined, passes falsy-but-defined", () => {
      expect(() => assertDefined(null)).toThrow("Assertion failed");
      expect(() => assertDefined(undefined, "boom")).toThrow("boom");
      assertDefined(0);
      assertDefined("");
      const v: number | undefined = 7 as number | undefined;
      assertDefined(v);
      expect(v.toFixed(0)).toBe("7"); // narrowed
    });
    it("assertNever throws with the offending value", () => {
      type Shape = { kind: "a" } | { kind: "b" };
      const handle = (s: Shape): string => {
        switch (s.kind) {
          case "a":
            return "A";
          case "b":
            return "B";
          default:
            return assertNever(s);
        }
      };
      expect(handle({ kind: "a" })).toBe("A");
      expect(() => assertNever("rogue" as never)).toThrow("Unexpected value: rogue");
    });
    it("noop returns undefined and takes no action", () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe("parseJsonSafe documented edge", () => {
    it('"null" is valid JSON and parses to null', () => {
      expect(parseJsonSafe<unknown>("null", 42)).toBeNull();
    });
    it("whitespace-only input falls back", () => {
      expect(parseJsonSafe("   ", 42)).toBe(42);
    });
  });
});
