import { resetSingletonFactory, singletonFactory } from "../../../src/shared/singleton-factory";

describe("singletonFactory", () => {
  it("should return same instance on multiple calls", () => {
    let count = 0;
    const get = singletonFactory(() => {
      count++;
      return { id: count };
    });
    const a = get();
    const b = get();
    expect(a).toBe(b);
    expect(a.id).toBe(1);
    expect(count).toBe(1);
  });

  it("should create new instance after reset", () => {
    let count = 0;
    const get = singletonFactory(() => {
      count++;
      return { id: count };
    });
    const a = get();
    resetSingletonFactory(get);
    const b = get();
    expect(a).not.toBe(b);
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
  });

  it("resetSingletonFactory on non-singleton getter is no-op", () => {
    const normal = () => ({ x: 1 });
    expect(() => resetSingletonFactory(normal)).not.toThrow();
  });
});
