import {
  coerceBoolean,
  coerceNumber,
  coerceString,
  sanitizeForJson,
  withDefaults,
} from "../../../src/shared";

describe("withDefaults", () => {
  it("fills in missing keys without overriding the ones present", () => {
    expect(withDefaults({ a: 1 } as { a: number; b?: number }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("keeps the base value when both sides define a key", () => {
    expect(withDefaults({ a: 1 }, { a: 99 })).toEqual({ a: 1 });
  });

  it("returns a new object rather than mutating either input", () => {
    const base = { a: 1 };
    const defaults = { a: 99, b: 2 } as Partial<typeof base>;
    const result = withDefaults(base, defaults);
    expect(result).not.toBe(base);
    expect(base).toEqual({ a: 1 });
  });
});

describe("coerceNumber", () => {
  it("passes finite numbers straight through", () => {
    expect(coerceNumber(42, 0)).toBe(42);
    expect(coerceNumber(-1.5, 0)).toBe(-1.5);
    expect(coerceNumber(0, 7)).toBe(0);
  });

  it("parses numeric strings", () => {
    expect(coerceNumber("42", 0)).toBe(42);
    expect(coerceNumber(" 3 ", 0)).toBe(3);
  });

  it("falls back for non-finite input", () => {
    expect(coerceNumber(Number.NaN, 7)).toBe(7);
    expect(coerceNumber(Number.POSITIVE_INFINITY, 7)).toBe(7);
    expect(coerceNumber("abc", 7)).toBe(7);
    expect(coerceNumber(undefined, 7)).toBe(7);
    expect(coerceNumber({}, 7)).toBe(7);
  });
});

describe("coerceBoolean", () => {
  it("passes booleans straight through", () => {
    expect(coerceBoolean(true, false)).toBe(true);
    expect(coerceBoolean(false, true)).toBe(false);
  });

  it("accepts the string and numeric spellings", () => {
    expect(coerceBoolean("true", false)).toBe(true);
    expect(coerceBoolean(1, false)).toBe(true);
    expect(coerceBoolean("false", true)).toBe(false);
    expect(coerceBoolean(0, true)).toBe(false);
  });

  it("falls back for anything else", () => {
    expect(coerceBoolean("yes", true)).toBe(true);
    expect(coerceBoolean("yes", false)).toBe(false);
    expect(coerceBoolean(null, true)).toBe(true);
  });
});

describe("coerceString", () => {
  it("passes strings straight through, empty string included", () => {
    expect(coerceString("hi", "fb")).toBe("hi");
    expect(coerceString("", "fb")).toBe("");
  });

  it("falls back only for null and undefined", () => {
    expect(coerceString(null, "fb")).toBe("fb");
    expect(coerceString(undefined, "fb")).toBe("fb");
  });

  it("stringifies other values", () => {
    expect(coerceString(42, "fb")).toBe("42");
    expect(coerceString(false, "fb")).toBe("false");
  });
});

describe("sanitizeForJson", () => {
  it("returns primitives and null unchanged", () => {
    expect(sanitizeForJson(1)).toBe(1);
    expect(sanitizeForJson("s")).toBe("s");
    expect(sanitizeForJson(null)).toBeNull();
  });

  it("rebuilds nested objects and arrays as copies", () => {
    const input = { a: [1, { b: 2 }] };
    const out = sanitizeForJson(input);
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
    expect(out.a).not.toBe(input.a);
  });

  it("survives a round trip through JSON", () => {
    const input = { a: 1, b: [true, "x"], c: { d: null } };
    expect(JSON.parse(JSON.stringify(sanitizeForJson(input)))).toEqual(input);
  });
});
