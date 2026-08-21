/**
 * @file prototype-pollution + aliasing regression tests.
 * These assert the CVE-class vectors that the frozen implementation was
 * vulnerable to are now closed. Each test restores Object.prototype after
 * itself so a failure can't cascade across the suite.
 */

import { safeClone } from "../../../src/shared/clone";
import { setByPath } from "../../../src/shared/get-set";
import { deepMerge } from "../../../src/shared/merge";

function protoKeys(): string[] {
  return ["polluted", "x", "isAdmin", "pwn", "a"];
}
afterEach(() => {
  for (const k of protoKeys()) {
    delete (Object.prototype as Record<string, unknown>)[k];
  }
});

describe("prototype pollution — deepMerge", () => {
  it("does not pollute via a JSON-parsed __proto__ payload (clone attack)", () => {
    const evil = JSON.parse('{"__proto__":{"polluted":"yes"}}');
    const out = deepMerge({}, evil);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect((out as Record<string, unknown>).polluted).toBeUndefined();
  });
  it("does not pollute via nested __proto__", () => {
    const evil = JSON.parse('{"a":{"__proto__":{"pwn":1}}}');
    deepMerge({ a: {} }, evil);
    expect(({} as Record<string, unknown>).pwn).toBeUndefined();
  });
  it("does not pollute via constructor.prototype", () => {
    const evil = JSON.parse('{"constructor":{"prototype":{"a":"b"}}}');
    deepMerge({}, evil);
    expect(({} as Record<string, unknown>).a).toBeUndefined();
  });
});

describe("reference aliasing — deepMerge", () => {
  it("does not share source-only nested references with the result", () => {
    const src = { n: { deep: 1 } };
    const out = deepMerge({}, src) as { n: { deep: number } };
    out.n.deep = 999;
    expect(src.n.deep).toBe(1);
  });
  it("does not share source-only array references with the result", () => {
    const src = { arr: [{ v: 1 }] };
    const out = deepMerge({}, src) as { arr: { v: number }[] };
    out.arr[0].v = 2;
    expect(src.arr[0].v).toBe(1);
  });
  it("concatArrays clones concatenated source elements", () => {
    const tgt = { arr: [{ v: 0 }] };
    const src = { arr: [{ v: 1 }] };
    const out = deepMerge(tgt, src, { concatArrays: true }) as { arr: { v: number }[] };
    out.arr[1].v = 99;
    expect(src.arr[0].v).toBe(1);
  });
});

describe("prototype pollution — setByPath", () => {
  it("throws and does not pollute via __proto__ path", () => {
    expect(() => setByPath({}, "__proto__.x", "PWNED")).toThrow(/prototype pollution/);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
  it("throws on constructor and prototype segments", () => {
    expect(() => setByPath({}, "constructor.prototype.x", 1)).toThrow();
    expect(() => setByPath({}, "a.prototype.x", 1)).toThrow();
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
  it("array-form forbidden segment is rejected", () => {
    expect(() => setByPath({}, ["__proto__", "x"], 1)).toThrow();
  });
});

describe("safeClone strips pollution vectors", () => {
  it("drops __proto__ own-key from a JSON payload", () => {
    const evil = JSON.parse('{"__proto__":{"polluted":1},"ok":2}');
    const clone = safeClone(evil) as Record<string, unknown>;
    expect(clone.ok).toBe(2);
    expect(Object.getPrototypeOf(clone)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it("deep-clones without aliasing", () => {
    const src = { a: { b: [1, 2] } };
    const clone = safeClone(src);
    clone.a.b.push(3);
    expect(src.a.b).toEqual([1, 2]);
  });
});
