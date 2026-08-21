import { createFactory } from "../../../src/shared/create-factory";

describe("createFactory – frozen behavior pins (object defaults)", () => {
  it("shares nested objects by reference across instances (documented shallow merge)", () => {
    const factory = createFactory({ a: 1, nested: { x: 1 } });
    const first = factory();
    const second = factory();
    expect(first.nested).toBe(second.nested);
  });

  it("explicit undefined in overrides clobbers the default (spread semantics)", () => {
    const factory = createFactory<{ a: number; b?: string }>({ a: 1, b: "x" });
    expect(factory({ b: undefined }).b).toBeUndefined();
  });

  it("returns a fresh top-level object each call", () => {
    const factory = createFactory({ a: 1 });
    expect(factory()).not.toBe(factory());
  });
});

describe("createFactory – function defaults", () => {
  it("produces fresh nested objects per build (no shared references)", () => {
    const factory = createFactory(() => ({ nested: { x: 1 } }));
    const first = factory();
    const second = factory();
    expect(first.nested).not.toBe(second.nested);
    first.nested.x = 99;
    expect(second.nested.x).toBe(1);
  });

  it("provides a 1-based incrementing sequence", () => {
    const factory = createFactory(({ sequence }) => ({ id: sequence }));
    expect(factory().id).toBe(1);
    expect(factory().id).toBe(2);
    expect(factory().id).toBe(3);
  });

  it("rewindSequence resets the counter to 1", () => {
    const factory = createFactory(({ sequence }) => ({ id: sequence }));
    factory();
    factory();
    factory.rewindSequence();
    expect(factory().id).toBe(1);
  });

  it("overrides still win over function defaults", () => {
    const factory = createFactory(({ sequence }) => ({ id: sequence, name: "anon" }));
    expect(factory({ name: "alice" })).toEqual({ id: 1, name: "alice" });
  });
});

describe("createFactory – buildList", () => {
  it("builds count items with shared overrides", () => {
    const factory = createFactory({ a: 1, b: "x" });
    const items = factory.buildList(3, { b: "y" });
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item).toEqual({ a: 1, b: "y" });
    }
    expect(items[0]).not.toBe(items[1]);
  });

  it("supports per-index override functions", () => {
    const factory = createFactory({ id: 0, name: "anon" });
    const items = factory.buildList(3, (index) => ({ id: index * 10 }));
    expect(items.map((item) => item.id)).toEqual([0, 10, 20]);
  });

  it("consumes the sequence once per item", () => {
    const factory = createFactory(({ sequence }) => ({ id: sequence }));
    expect(factory.buildList(3).map((item) => item.id)).toEqual([1, 2, 3]);
    expect(factory().id).toBe(4);
  });

  it("buildList(0) returns an empty array", () => {
    const factory = createFactory({ a: 1 });
    expect(factory.buildList(0)).toEqual([]);
  });

  it("rejects negative, fractional, and NaN counts", () => {
    const factory = createFactory({ a: 1 });
    expect(() => factory.buildList(-1)).toThrow(RangeError);
    expect(() => factory.buildList(2.5)).toThrow(RangeError);
    expect(() => factory.buildList(Number.NaN)).toThrow(RangeError);
  });
});

describe("createFactory – extend", () => {
  it("derived factory layers extension over base defaults", () => {
    const base = createFactory({ role: "user", active: true });
    const admin = base.extend({ role: "admin" });
    expect(admin()).toEqual({ role: "admin", active: true });
    expect(base()).toEqual({ role: "user", active: true });
  });

  it("call-time overrides beat the extension", () => {
    const base = createFactory({ role: "user" });
    const admin = base.extend({ role: "admin" });
    expect(admin({ role: "root" }).role).toBe("root");
  });

  it("supports function extensions with their own sequence", () => {
    const base = createFactory<{ id: number; tag: string }>(({ sequence }) => ({
      id: sequence,
      tag: "base",
    }));
    const derived = base.extend(({ sequence }) => ({ tag: `derived-${sequence}` }));
    expect(derived()).toEqual({ id: 1, tag: "derived-1" });
    expect(derived()).toEqual({ id: 2, tag: "derived-2" });
    // base factory's own counter is untouched by derived builds
    expect(base().id).toBe(1);
  });

  it("extend chains compose", () => {
    const base = createFactory({ a: 1, b: 1, c: 1 });
    const chained = base.extend({ b: 2 }).extend({ c: 3 });
    expect(chained()).toEqual({ a: 1, b: 2, c: 3 });
  });
});
