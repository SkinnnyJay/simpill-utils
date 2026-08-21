/** @file middleware-chain uplift: koa-compose guard, snapshot, validation */
import { createMiddlewareChain } from "../../../src/server/middleware-chain";

describe("double next() guard", () => {
  it("rejects TypeError instead of running the terminal handler twice", async () => {
    const chain = createMiddlewareChain();
    let terminal = 0;
    chain.use(async (_req, next) => {
      await next();
      return next(); // buggy middleware
    });
    await expect(
      chain.run({}, async () => {
        terminal++;
        return new Response("ok");
      })
    ).rejects.toThrow("next() called multiple times");
    expect(terminal).toBe(1); // no double response / double side effects
  });

  it("guards every position including the last-before-terminal", async () => {
    const chain = createMiddlewareChain();
    chain.use((_req, next) => next());
    chain.use(async (_req, next) => {
      await next();
      return next();
    });
    await expect(chain.run({}, async () => new Response("t"))).rejects.toThrow(TypeError);
  });

  it("separate run() calls do not share guard state", async () => {
    const chain = createMiddlewareChain();
    chain.use((_req, next) => next());
    const [a, b] = await Promise.all([
      chain.run({}, async () => new Response("a")),
      chain.run({}, async () => new Response("b")),
    ]);
    expect(await a.text()).toBe("a");
    expect(await b.text()).toBe("b");
  });
});

describe("hardening", () => {
  it("use() rejects non-functions loudly", () => {
    const chain = createMiddlewareChain();
    expect(() => chain.use(null as never)).toThrow(TypeError);
    expect(() => chain.use("mw" as never)).toThrow(TypeError);
  });

  it("middleware list is snapshotted per run — use() mid-dispatch cannot inject into the running chain", async () => {
    const chain = createMiddlewareChain();
    const seen: string[] = [];
    chain.use((_req, next) => {
      chain.use((_r, n) => {
        seen.push("injected");
        return n();
      });
      seen.push("first");
      return next();
    });
    await chain.run({}, async () => new Response("done"));
    expect(seen).toEqual(["first"]); // injected mw only affects FUTURE runs
  });

  it("synchronous throws become rejections", async () => {
    const chain = createMiddlewareChain();
    chain.use(() => {
      throw new Error("sync boom");
    });
    await expect(chain.run({}, async () => new Response("x"))).rejects.toThrow("sync boom");
  });
});
