import { z } from "zod";
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

  it("request.withRequestContext runs handler with context", async () => {
    const app = createNextApp();
    const result = await app.request.withRequestContext(async () => 42);
    expect(result).toBe(42);
  });

  it("request.parseSearchParams parses and validates", () => {
    const app = createNextApp();
    const schema = z.object({ q: z.string() });
    const req = { url: "http://x/?q=hello" };
    const out = app.request.parseSearchParams(req, schema);
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.q).toBe("hello");
  });

  it("request.getRequestContext is callable and returns object or undefined when outside context", () => {
    const app = createNextApp();
    expect(typeof app.request.getRequestContext).toBe("function");
    expect(() => app.request.getRequestContext()).not.toThrow();
    const ctx = app.request.getRequestContext();
    if (ctx !== undefined && ctx !== null && typeof ctx === "object") {
      expect(typeof ("requestId" in ctx ? ctx.requestId : undefined)).toBe("string");
      expect(typeof ("traceId" in ctx ? ctx.traceId : undefined)).toBe("string");
    }
  });

  it("response.json and response.error return Response", () => {
    const app = createNextApp();
    const r1 = app.response.json({ ok: true }, 200);
    expect(r1.status).toBe(200);
    const r2 = app.response.error(new Error("err"), 500);
    expect(r2.status).toBe(500);
  });

  it("uses annotations adapter when annotationsStore provided", () => {
    const store = new Map<string, unknown>();
    const annotationsStore = {
      get<T>(key: symbol | string): T | undefined {
        return store.get(String(key)) as T | undefined;
      },
      set(key: symbol | string, value: unknown): void {
        store.set(String(key), value);
      },
    };
    const app = createNextApp({ annotationsStore });
    app.annotations.setMetadata("k", "v");
    expect(app.annotations.getMetadata("k")).toBe("v");
  });
});
