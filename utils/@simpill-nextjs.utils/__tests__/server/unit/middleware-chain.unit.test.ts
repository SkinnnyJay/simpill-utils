import { createMiddlewareChain } from "../../../src/server/middleware-chain";

describe("createMiddlewareChain", () => {
  it("runs defaultNext when no middleware added", async () => {
    const chain = createMiddlewareChain();
    const res = await chain.run(
      { url: "https://x.com" },
      async () => new Response("ok", { status: 200 })
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("runs middleware in order; first that returns short-circuits", async () => {
    const chain = createMiddlewareChain();
    chain.use((_req, next) => next());
    chain.use((_req, _next) => Promise.resolve(new Response("handled", { status: 201 })));
    const res = await chain.run({}, async () => new Response("default"));
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("handled");
  });
});
