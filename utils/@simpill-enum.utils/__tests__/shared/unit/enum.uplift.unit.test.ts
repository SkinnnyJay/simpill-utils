import * as rootBarrel from "../../../src";
import * as clientBarrel from "../../../src/client";
import * as serverBarrel from "../../../src/server";
import * as sharedBarrel from "../../../src/shared";
import {
  assertEnumValue,
  EnumHelper,
  enumEntries,
  enumKeys,
  enumValues,
  getEnumKey,
  getEnumValue,
  InvalidEnumValueError,
  isEnumKey,
  isValidEnumValue,
} from "../../../src/shared";

// Real compiled TypeScript enums — these carry reverse mappings at runtime.
enum NumericEnum {
  Zero = 0,
  One = 1,
  Negative = -5,
  Big = 404,
}

enum StringEnum {
  Active = "active",
  Inactive = "inactive",
}

enum HeterogeneousEnum {
  Str = "str",
  Num = 7,
}

const ConstObj = { A: "a", B: "b", C: "c" } as const;

// Hostile const object: obj[obj.a] is a number, but "a" is a REAL member —
// the round-trip guard must not misclassify it as a reverse mapping.
const Hostile = { a: "b", b: 1 } as const;

describe("enum.utils uplift", () => {
  describe("numeric enum reverse-mapping trap (TS#57134)", () => {
    it("rejects member NAMES as values", () => {
      // Naive Object.values(NumericEnum).includes("Zero") is true — the bug.
      expect(isValidEnumValue(NumericEnum, "Zero")).toBe(false);
      expect(isValidEnumValue(NumericEnum, "Negative")).toBe(false);
      expect(getEnumValue(NumericEnum, "One")).toBeUndefined();
    });

    it("accepts real numeric member values including 0 and negatives", () => {
      expect(isValidEnumValue(NumericEnum, 0)).toBe(true);
      expect(isValidEnumValue(NumericEnum, -5)).toBe(true);
      expect(isValidEnumValue(NumericEnum, 404)).toBe(true);
      expect(getEnumValue(NumericEnum, 0)).toBe(NumericEnum.Zero);
    });

    it("is strict about types: '0' is not 0", () => {
      expect(isValidEnumValue(NumericEnum, "0")).toBe(false);
      expect(isValidEnumValue(NumericEnum, "404")).toBe(false);
    });

    it("enumValues excludes reverse-mapping artifacts", () => {
      expect(enumValues(NumericEnum).sort()).toEqual([-5, 0, 1, 404].sort());
    });

    it("enumKeys excludes reverse-mapping keys", () => {
      expect(enumKeys(NumericEnum).sort()).toEqual(["Big", "Negative", "One", "Zero"]);
    });

    it("enumEntries pairs member keys with member values only", () => {
      expect(new Map(enumEntries(NumericEnum)).get("Big")).toBe(404);
      expect(enumEntries(NumericEnum)).toHaveLength(4);
    });
  });

  describe("string and heterogeneous enums", () => {
    it("string enums work end to end", () => {
      expect(isValidEnumValue(StringEnum, "active")).toBe(true);
      expect(isValidEnumValue(StringEnum, "Active")).toBe(false);
      expect(enumValues(StringEnum).sort()).toEqual(["active", "inactive"]);
      expect(enumKeys(StringEnum).sort()).toEqual(["Active", "Inactive"]);
    });

    it("heterogeneous enums keep string members and filter numeric reverse keys", () => {
      expect(enumKeys(HeterogeneousEnum).sort()).toEqual(["Num", "Str"]);
      expect(enumValues(HeterogeneousEnum).sort()).toEqual([7, "str"]);
      expect(isValidEnumValue(HeterogeneousEnum, "Num")).toBe(false);
      expect(isValidEnumValue(HeterogeneousEnum, 7)).toBe(true);
    });
  });

  describe("hostile const objects", () => {
    it("round-trip guard keeps { a: 'b', b: 1 } members intact", () => {
      expect(enumKeys(Hostile).sort()).toEqual(["a", "b"]);
      expect(isValidEnumValue(Hostile, "b")).toBe(true);
      expect(isValidEnumValue(Hostile, 1)).toBe(true);
    });
  });

  describe("getEnumKey (reverse lookup — works for string enums too)", () => {
    it("returns member key for string enum values", () => {
      expect(getEnumKey(StringEnum, "active")).toBe("Active");
    });

    it("returns member key for numeric enum values", () => {
      expect(getEnumKey(NumericEnum, -5)).toBe("Negative");
      expect(getEnumKey(NumericEnum, 0)).toBe("Zero");
    });

    it("returns undefined or default for unknown values", () => {
      expect(getEnumKey(StringEnum, "nope")).toBeUndefined();
      expect(getEnumKey(StringEnum, "nope", "Inactive")).toBe("Inactive");
    });

    it("first key wins on duplicate values", () => {
      const Dup = { First: "x", Second: "x" } as const;
      expect(getEnumKey(Dup, "x")).toBe("First");
    });
  });

  describe("isEnumKey", () => {
    it("accepts member keys and rejects reverse-mapping keys", () => {
      expect(isEnumKey(NumericEnum, "Zero")).toBe(true);
      expect(isEnumKey(NumericEnum, "0")).toBe(false);
      expect(isEnumKey(NumericEnum, "nope")).toBe(false);
      expect(isEnumKey(NumericEnum, 0)).toBe(false);
    });

    it("does not walk the prototype chain", () => {
      expect(isEnumKey(ConstObj, "toString")).toBe(false);
      expect(isEnumKey(ConstObj, "constructor")).toBe(false);
    });
  });

  describe("assertEnumValue", () => {
    it("returns the value when valid", () => {
      expect(assertEnumValue(StringEnum, "active")).toBe("active");
      expect(assertEnumValue(NumericEnum, 404)).toBe(404);
    });

    it("throws InvalidEnumValueError with received + allowed", () => {
      let caught: unknown;
      try {
        assertEnumValue(StringEnum, "nope", "status");
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(InvalidEnumValueError);
      const e = caught as InvalidEnumValueError;
      expect(e.received).toBe("nope");
      expect(e.allowed).toEqual(expect.arrayContaining(["active", "inactive"]));
      expect(e.message).toContain("status");
      expect(e.message).toContain('"nope"');
      expect(e.message).toContain('"active"');
    });

    it("message handles non-primitive received values without throwing", () => {
      expect(() => assertEnumValue(StringEnum, { evil: true })).toThrow(InvalidEnumValueError);
      expect(() => assertEnumValue(StringEnum, null)).toThrow(InvalidEnumValueError);
      expect(() => assertEnumValue(StringEnum, undefined)).toThrow(InvalidEnumValueError);
    });
  });

  describe("cache integrity", () => {
    it("mutating a returned array does not corrupt later results", () => {
      const first = enumValues(StringEnum);
      first.length = 0;
      first.push("poisoned" as StringEnum);
      expect(enumValues(StringEnum).sort()).toEqual(["active", "inactive"]);
      expect(isValidEnumValue(StringEnum, "poisoned")).toBe(false);
    });

    it("repeated calls stay consistent", () => {
      for (let i = 0; i < 3; i++) {
        expect(enumKeys(NumericEnum)).toHaveLength(4);
        expect(isValidEnumValue(NumericEnum, 1)).toBe(true);
      }
    });

    it("distinct enum objects with identical shapes do not collide", () => {
      const A = { X: "x" } as const;
      const B = { X: "x", Y: "y" } as const;
      expect(enumKeys(A)).toEqual(["X"]);
      expect(enumKeys(B).sort()).toEqual(["X", "Y"]);
    });
  });

  describe("property test vs oracle (seeded LCG)", () => {
    // Deterministic LCG so failures reproduce.
    let seed = 0xc0ffee;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    function buildCompiledEnumLike(memberCount: number): {
      obj: Record<string, string | number>;
      memberKeys: string[];
      memberValues: (string | number)[];
    } {
      // Emulate exactly what tsc emits: numeric members get reverse mappings.
      const obj: Record<string, string | number> = {};
      const memberKeys: string[] = [];
      const memberValues: (string | number)[] = [];
      for (let i = 0; i < memberCount; i++) {
        const key = `M${i}_${Math.floor(rand() * 1000)}`;
        if (rand() < 0.5) {
          const value = Math.floor(rand() * 2000) - 1000;
          if (memberValues.includes(value) || obj[String(value)] !== undefined) continue;
          obj[key] = value;
          obj[String(value)] = key; // reverse mapping, as tsc emits
        } else {
          const value = `v${Math.floor(rand() * 10000)}`;
          if (memberValues.includes(value)) continue;
          obj[key] = value;
        }
        memberKeys.push(key);
        memberValues.push(obj[key]);
      }
      return { obj, memberKeys, memberValues };
    }

    it("enumKeys/enumValues/isValidEnumValue match the construction oracle across 200 random enums", () => {
      for (let round = 0; round < 200; round++) {
        const { obj, memberKeys, memberValues } = buildCompiledEnumLike(1 + Math.floor(rand() * 8));
        expect(enumKeys(obj).sort()).toEqual([...memberKeys].sort());
        expect(enumValues(obj).sort()).toEqual([...memberValues].sort());
        for (const v of memberValues) {
          expect(isValidEnumValue(obj, v)).toBe(true);
        }
        for (const k of memberKeys) {
          // A member NAME is only a valid VALUE if some member's value equals it.
          expect(isValidEnumValue(obj, k)).toBe(memberValues.includes(k));
          expect(isEnumKey(obj, k)).toBe(true);
        }
      }
    });
  });

  describe("EnumHelper surface", () => {
    it("exposes all helpers", () => {
      expect(EnumHelper.getEnumValue(ConstObj, "a")).toBe("a");
      expect(EnumHelper.isValidEnumValue(ConstObj, "x")).toBe(false);
      expect(EnumHelper.getEnumKey(ConstObj, "b")).toBe("B");
      expect(EnumHelper.isEnumKey(ConstObj, "C")).toBe(true);
      expect(EnumHelper.enumValues(ConstObj)).toEqual(["a", "b", "c"]);
      expect(EnumHelper.enumKeys(ConstObj)).toEqual(["A", "B", "C"]);
      expect(EnumHelper.enumEntries(ConstObj)).toEqual([
        ["A", "a"],
        ["B", "b"],
        ["C", "c"],
      ]);
      expect(EnumHelper.assertEnumValue(ConstObj, "c")).toBe("c");
    });
  });

  describe("barrel parity", () => {
    it("root, client, server and shared expose the same surface", () => {
      const names = Object.keys(sharedBarrel).sort();
      expect(names.length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(rootBarrel).sort()).toEqual(names);
      expect(Object.keys(clientBarrel).sort()).toEqual(names);
      expect(Object.keys(serverBarrel).sort()).toEqual(names);
    });
  });
});
