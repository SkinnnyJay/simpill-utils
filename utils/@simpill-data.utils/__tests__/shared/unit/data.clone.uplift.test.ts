import { deepClone } from "../../../src/shared/data.utils";

/** Seeded LCG for reproducible property tests (house convention). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomJsonValue(rnd: () => number, depth: number): unknown {
  const r = rnd();
  if (depth <= 0 || r < 0.35) {
    const leaf = rnd();
    if (leaf < 0.25) return Math.floor(rnd() * 1000);
    if (leaf < 0.5) return `s${Math.floor(rnd() * 1000)}`;
    if (leaf < 0.7) return rnd() < 0.5;
    return null;
  }
  if (r < 0.65) {
    const len = Math.floor(rnd() * 5);
    const arr = new Array(len);
    for (let i = 0; i < len; i++) arr[i] = randomJsonValue(rnd, depth - 1);
    return arr;
  }
  const obj: Record<string, unknown> = {};
  const keys = Math.floor(rnd() * 5);
  for (let i = 0; i < keys; i++) obj[`k${i}`] = randomJsonValue(rnd, depth - 1);
  return obj;
}

describe("deepClone uplift", () => {
  it("clones circular structures instead of crashing (frozen ref threw RangeError)", () => {
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    const b = deepClone(a) as typeof a;
    expect(b).not.toBe(a);
    expect(b.x).toBe(1);
    expect(b.self).toBe(b); // cycle preserved, pointing at the clone
  });

  it("preserves shared references (diamond) instead of duplicating", () => {
    const shared = { v: 1 };
    const src = { a: shared, b: shared };
    const out = deepClone(src);
    expect(out.a).not.toBe(shared);
    expect(out.a).toBe(out.b);
  });

  it("clones 100k-deep trees without stack overflow (frozen ref threw RangeError)", () => {
    let node: Record<string, unknown> = {};
    const root = node;
    for (let i = 0; i < 100_000; i++) {
      const next: Record<string, unknown> = {};
      node.n = next;
      node = next;
    }
    node.leaf = 42;
    const cloned = deepClone(root);
    let walk: Record<string, unknown> = cloned;
    for (let i = 0; i < 100_000; i++) walk = walk.n as Record<string, unknown>;
    expect(walk.leaf).toBe(42);
  });

  it("clones Date (frozen ref returned {})", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    const out = deepClone({ when: d });
    expect(out.when).toBeInstanceOf(Date);
    expect(out.when.getTime()).toBe(d.getTime());
    expect(out.when).not.toBe(d);
  });

  it("clones RegExp with flags and lastIndex (frozen ref returned {})", () => {
    const re = /ab/g;
    re.lastIndex = 1;
    const out = deepClone({ re }).re;
    expect(out).toBeInstanceOf(RegExp);
    expect(out.source).toBe("ab");
    expect(out.flags).toBe("g");
    expect(out.lastIndex).toBe(1);
    expect(out).not.toBe(re);
  });

  it("clones Map including object keys and values (frozen ref returned {})", () => {
    const key = { id: 1 };
    const val = { name: "x" };
    const m = new Map([[key, val]]);
    const out = deepClone(m);
    expect(out).toBeInstanceOf(Map);
    expect(out.size).toBe(1);
    const [[ck, cv]] = [...out.entries()];
    expect(ck).toEqual(key);
    expect(ck).not.toBe(key);
    expect(cv).toEqual(val);
    expect(cv).not.toBe(val);
  });

  it("clones Set (frozen ref returned {})", () => {
    const inner = { a: 1 };
    const out = deepClone(new Set([1, inner]));
    expect(out).toBeInstanceOf(Set);
    expect(out.size).toBe(2);
    expect(out.has(1)).toBe(true);
    const objects = [...out].filter((v) => typeof v === "object") as Array<{ a: number }>;
    expect(objects[0]).toEqual(inner);
    expect(objects[0]).not.toBe(inner);
  });

  it("clones TypedArray and ArrayBuffer by copy", () => {
    const ta = new Uint8Array([1, 2, 3]);
    const out = deepClone({ ta });
    expect(out.ta).toBeInstanceOf(Uint8Array);
    expect([...out.ta]).toEqual([1, 2, 3]);
    out.ta[0] = 99;
    expect(ta[0]).toBe(1);

    const buf = new ArrayBuffer(4);
    const clonedBuf = deepClone(buf);
    expect(clonedBuf).toBeInstanceOf(ArrayBuffer);
    expect(clonedBuf).not.toBe(buf);
    expect(clonedBuf.byteLength).toBe(4);
  });

  it("preserves class prototypes (frozen ref flattened instances to plain objects)", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
      norm(): number {
        return Math.hypot(this.x, this.y);
      }
    }
    const out = deepClone(new Point(3, 4));
    expect(out).toBeInstanceOf(Point);
    expect(out.norm()).toBe(5);
  });

  it("keeps an own __proto__ key as a data property instead of replacing the prototype", () => {
    const evil = JSON.parse('{"__proto__": {"isAdmin": true}}') as Record<string, unknown>;
    const out = deepClone(evil) as Record<string, unknown>;
    expect((out as { isAdmin?: boolean }).isAdmin).toBeUndefined();
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toEqual({ isAdmin: true });
  });

  it("property: matches structuredClone on 200 random JSON graphs (seeded)", () => {
    const rnd = lcg(0xdeadbeef);
    for (let i = 0; i < 200; i++) {
      const value = randomJsonValue(rnd, 5);
      expect(deepClone(value)).toEqual(structuredClone(value));
    }
  });
});
