import { CycleError, topologicalSort } from "../../../src/shared/topo-sort";

describe("topologicalSort", () => {
  it("orders a simple DAG so every edge points forward", () => {
    const nodes = ["a", "b", "c", "d"];
    const edges: Array<[string, string]> = [
      ["a", "b"],
      ["a", "c"],
      ["b", "d"],
      ["c", "d"],
    ];
    const order = topologicalSort(nodes, edges);
    expect(order).toHaveLength(4);
    const pos = new Map(order.map((n, i) => [n, i]));
    for (const [from, to] of edges) {
      expect(pos.get(from) as number).toBeLessThan(pos.get(to) as number);
    }
  });

  it("is deterministic: ties resolve in input order of nodes", () => {
    const order = topologicalSort(["z", "a", "m"], []);
    expect(order).toEqual(["z", "a", "m"]);
    expect(topologicalSort(["z", "a", "m"], [])).toEqual(order);
  });

  it("includes isolated nodes", () => {
    const order = topologicalSort(["a", "isolated", "b"], [["a", "b"]]);
    expect(order).toContain("isolated");
    expect(order).toHaveLength(3);
  });

  it("throws CycleError on a cycle, reporting the nodes involved", () => {
    const edges: Array<[string, string]> = [
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
      ["c", "d"],
    ];
    let caught: unknown;
    try {
      topologicalSort(["a", "b", "c", "d"], edges);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(CycleError);
    const err = caught as CycleError<string>;
    expect(err.name).toBe("CycleError");
    expect(err.nodes).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });

  it("throws on self-loops", () => {
    expect(() => topologicalSort(["a"], [["a", "a"]])).toThrow(CycleError);
  });

  it("rejects edges referencing unknown nodes", () => {
    expect(() => topologicalSort(["a"], [["a", "ghost"]])).toThrow(/not present/);
  });

  it("works with non-string node types (object identity)", () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const order = topologicalSort([b, a], [[a, b]]);
    expect(order).toEqual([a, b]);
  });

  it("handles a larger layered DAG (dependency-resolution shape)", () => {
    const n = 500;
    const nodes = Array.from({ length: n }, (_, i) => i);
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
    const order = topologicalSort(nodes, edges);
    expect(order).toEqual(nodes);
  });
});
