import { createTestPatterns } from "../../../src/shared/test-patterns";

describe("TestPatterns", () => {
  it("createFixture merges overrides", () => {
    const t = createTestPatterns();
    const fixture = t.createFixture({ id: 1, name: "a" });
    expect(fixture()).toEqual({ id: 1, name: "a" });
    expect(fixture({ name: "b" })).toEqual({ id: 1, name: "b" });
  });

  it("createDouble records calls", () => {
    const t = createTestPatterns();
    const d = t.createDouble<[number], string>("ok");
    d.fn(1);
    d.fn(2);
    expect(d.calls).toEqual([[1], [2]]);
    d.reset();
    expect(d.calls).toEqual([]);
  });
});
