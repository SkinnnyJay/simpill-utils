/**
 * @file Safe Stringify Unit Tests
 */

import { SAFE_STRINGIFY_TOKENS } from "../../../src/shared/constants";
import { safeStringify } from "../../../src/shared/safe-stringify";

describe("safeStringify", () => {
  describe("fast path parity with JSON.stringify", () => {
    const cases: unknown[] = [
      { a: 1, b: "two", c: [1, 2, 3], d: { nested: true }, e: null },
      [1, "a", null, { x: 1 }],
      "plain string",
      42,
      true,
      null,
      { date: new Date(0) },
      {},
      [],
    ];

    it.each(cases.map((c) => [c]))("matches JSON.stringify for %j", (value) => {
      expect(safeStringify(value)).toBe(JSON.stringify(value));
    });
  });

  it("handles circular references instead of throwing", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = safeStringify(obj);
    expect(result).toContain('"a":1');
    expect(result).toContain(SAFE_STRINGIFY_TOKENS.CIRCULAR);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("handles nested circular references through arrays", () => {
    const arr: unknown[] = [1, 2];
    const obj = { list: arr };
    arr.push(obj);
    const result = safeStringify(obj);
    expect(result).toContain(SAFE_STRINGIFY_TOKENS.CIRCULAR);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("does NOT mark repeated (non-circular) references as circular", () => {
    const shared = { s: 1 };
    const result = safeStringify({ a: shared, b: shared });
    expect(result).toBe('{"a":{"s":1},"b":{"s":1}}');
  });

  it("serializes BigInt as its decimal string instead of throwing", () => {
    const result = safeStringify({ big: 123n });
    expect(result).toBe('{"big":"123"}');
  });

  it("survives a throwing toJSON", () => {
    const evil = {
      ok: 1,
      bad: {
        toJSON(): never {
          throw new Error("boom");
        },
      },
    };
    const result = safeStringify(evil);
    expect(result).toContain('"ok":1');
    expect(result).toContain("boom");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("respects a working toJSON (Date)", () => {
    const d = new Date(0);
    // force the slow path with a sibling bigint
    const result = safeStringify({ d, big: 1n });
    expect(result).toContain(d.toJSON());
  });

  it("survives a throwing getter", () => {
    const obj = { fine: true };
    Object.defineProperty(obj, "trap", {
      enumerable: true,
      get(): never {
        throw new Error("getter boom");
      },
    });
    // JSON.stringify would throw -> slow path
    const result = safeStringify(obj);
    expect(result).toContain('"fine":true');
    expect(result).toContain("getter boom");
  });

  it("returns 'null' for undefined / function / symbol roots (never undefined)", () => {
    expect(safeStringify(undefined)).toBe("null");
    expect(safeStringify(() => 1)).toBe("null");
    expect(safeStringify(Symbol("x"))).toBe("null");
  });

  it("caps pathological depth instead of blowing the stack", () => {
    let deep: Record<string, unknown> = { leaf: true, big: 1n };
    for (let i = 0; i < 100_000; i++) {
      deep = { next: deep };
    }
    // native JSON.stringify overflows the stack on this input; safeStringify must not
    const result = safeStringify(deep);
    expect(typeof result).toBe("string");
    expect(result).toContain(SAFE_STRINGIFY_TOKENS.DEPTH);
  });

  it("matches JSON.stringify undefined-array-item behavior on the slow path", () => {
    const result = safeStringify({ arr: [1, undefined, 2], big: 1n });
    expect(result).toContain('"arr":[1,null,2]');
  });
});
