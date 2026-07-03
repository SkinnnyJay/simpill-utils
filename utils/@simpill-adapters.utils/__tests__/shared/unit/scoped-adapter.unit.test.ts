import { createAdapter, scopedAdapter } from "../../../src/shared/create-adapter";

describe("scopedAdapter", () => {
  it("binds methods so destructuring keeps `this` (raw Map method throws)", () => {
    const map = new Map<string, number>([["a", 1]]);
    const rawGet = map.get;
    expect(() => rawGet("a")).toThrow(TypeError); // the footgun

    const scoped = scopedAdapter(map, ["get", "set", "has", "delete"]);
    const { get, set } = scoped;
    set("b", 2);
    expect(get("a")).toBe(1);
    expect(get("b")).toBe(2);
  });

  it("hides unlisted members at runtime, unlike createAdapter", () => {
    const impl = {
      get: (k: string) => k,
      disconnect: jest.fn(),
    };
    // createAdapter is a compile-time view only — disconnect still reachable:
    const typedView = createAdapter<{ get(k: string): string }>(impl);
    expect((typedView as unknown as typeof impl).disconnect).toBe(impl.disconnect);

    // scopedAdapter enforces the view at runtime:
    const scoped = scopedAdapter(impl, ["get"]);
    expect("disconnect" in scoped).toBe(false);
    expect((scoped as unknown as Record<string, unknown>).disconnect).toBeUndefined();
    expect(scoped.get("x")).toBe("x");
  });

  it("exposes non-function members as live getters", () => {
    const impl = {
      count: 1,
      bump() {
        this.count++;
      },
    };
    const scoped = scopedAdapter(impl, ["count", "bump"]);
    expect(scoped.count).toBe(1);
    scoped.bump();
    expect(scoped.count).toBe(2); // reads through to impl, not a snapshot
  });
});
