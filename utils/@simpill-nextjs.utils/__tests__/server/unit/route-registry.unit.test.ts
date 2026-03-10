import { createRouteRegistry } from "../../../src/server/route-registry";

describe("createRouteRegistry", () => {
  it("defines and gets route by path and method", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/api/users", method: "GET", handlerKey: "getUsers" });
    expect(reg.get("/api/users", "GET")).toEqual({
      path: "/api/users",
      method: "GET",
      handlerKey: "getUsers",
    });
    expect(reg.get("/api/users", "POST")).toBeUndefined();
  });

  it("lists all routes", () => {
    const reg = createRouteRegistry();
    reg.define({ path: "/a", method: "GET" });
    reg.define({ path: "/b", method: "POST" });
    expect(reg.list()).toHaveLength(2);
  });
});
