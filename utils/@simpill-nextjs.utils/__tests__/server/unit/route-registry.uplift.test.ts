/** @file route-registry uplift: O(1) index parity, duplicates, :param match */
import { createRouteRegistry, DuplicateRouteError } from "../../../src/server/route-registry";

describe("index parity with frozen semantics", () => {
  it("duplicate define: get() returns the FIRST, list() shows both (frozen behavior)", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/a", method: "GET", handlerKey: "first" });
    reg.define({ path: "/a", method: "GET", handlerKey: "second" });
    expect(reg.get("/a", "GET")?.handlerKey).toBe("first");
    expect(reg.list()).toHaveLength(2);
  });

  it("method lookup stays case-insensitive", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/a", method: "get" });
    expect(reg.get("/a", "GET")?.path).toBe("/a");
    expect(reg.get("/a", "post")).toBeUndefined();
  });

  it('onDuplicate: "throw" surfaces silent shadowing as DuplicateRouteError', () => {
    const reg = createRouteRegistry({ onDuplicate: "throw" });
    reg.define({ path: "/a", method: "GET" });
    expect(() => reg.define({ path: "/a", method: "get" })).toThrow(DuplicateRouteError);
    expect(() => reg.define({ path: "/a", method: "POST" })).not.toThrow();
  });
});

describe("match() — :param path patterns", () => {
  it("resolves params and decodes segments", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/api/users/:id/posts/:postId", method: "GET", handlerKey: "h" });
    const m = reg.match?.("/api/users/u%2F1/posts/42", "get");
    expect(m?.route.handlerKey).toBe("h");
    expect(m?.params).toEqual({ id: "u/1", postId: "42" });
  });

  it("static routes win over param routes", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/api/users/:id", method: "GET", handlerKey: "param" });
    reg.define({ path: "/api/users/me", method: "GET", handlerKey: "static" });
    expect(reg.match?.("/api/users/me", "GET")?.route.handlerKey).toBe("static");
    expect(reg.match?.("/api/users/7", "GET")?.route.handlerKey).toBe("param");
  });

  it("no match on segment-count mismatch or wrong method", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/api/users/:id", method: "GET" });
    expect(reg.match?.("/api/users/1/extra", "GET")).toBeUndefined();
    expect(reg.match?.("/api/users", "GET")).toBeUndefined();
    expect(reg.match?.("/api/users/1", "POST")).toBeUndefined();
  });

  it("exact routes match with empty params", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/health", method: "GET" });
    expect(reg.match?.("/health", "GET")).toEqual({
      route: { path: "/health", method: "GET" },
      params: {},
    });
  });
});
