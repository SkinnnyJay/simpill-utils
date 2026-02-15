import { createNextApp } from "../../../src/server/create-next-app";

describe("createNextApp", () => {
  it("returns INextApp with all facets", () => {
    const app = createNextApp();
    expect(app.routes).toBeDefined();
    expect(app.routes.define).toBeDefined();
    expect(app.routes.get).toBeDefined();
    expect(app.routes.list).toBeDefined();
    expect(app.middleware).toBeDefined();
    expect(app.middleware.use).toBeDefined();
    expect(app.middleware.run).toBeDefined();
    expect(app.request).toBeDefined();
    expect(app.request.withRequestContext).toBeDefined();
    expect(app.request.parseSearchParams).toBeDefined();
    expect(app.request.getRequestContext).toBeDefined();
    expect(app.response).toBeDefined();
    expect(app.response.json).toBeDefined();
    expect(app.response.error).toBeDefined();
    expect(app.api).toBeDefined();
    expect(app.api.createSafeAction).toBeDefined();
    expect(app.logging).toBeDefined();
    expect(app.annotations).toBeDefined();
    expect(app.lifecycle).toBeDefined();
    expect(app.lifecycle.onInit).toBeDefined();
    expect(app.lifecycle.onShutdown).toBeDefined();
  });

  it("route registry is usable", () => {
    const app = createNextApp();
    app.routes.define({ path: "/api/health", method: "GET" });
    expect(app.routes.get("/api/health", "GET")?.path).toBe("/api/health");
  });
});
