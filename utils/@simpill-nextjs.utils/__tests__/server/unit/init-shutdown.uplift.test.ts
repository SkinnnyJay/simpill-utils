/** @file init-shutdown uplift: run-all shutdown, connect-once init, LIFO option */
import { createInitShutdown, ShutdownAggregateError } from "../../../src/server/init-shutdown";

describe("shutdown runs ALL callbacks", () => {
  it("a throwing callback no longer aborts the rest (leaked resources)", async () => {
    const life = createInitShutdown();
    const ran: string[] = [];
    life.onShutdown(() => {
      ran.push("close-http");
    });
    life.onShutdown(() => {
      throw new Error("flush failed");
    });
    life.onShutdown(() => {
      ran.push("close-db");
    });
    await expect(life.shutdown()).rejects.toThrow("flush failed"); // original error preserved
    expect(ran).toEqual(["close-http", "close-db"]); // close-db no longer leaked
  });

  it("multiple failures aggregate into ShutdownAggregateError with .errors", async () => {
    const life = createInitShutdown();
    life.onShutdown(() => {
      throw new Error("one");
    });
    life.onShutdown(() => {
      throw new Error("two");
    });
    const err = await life.shutdown().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ShutdownAggregateError);
    expect((err as ShutdownAggregateError).errors.map((e) => (e as Error).message)).toEqual([
      "one",
      "two",
    ]);
  });

  it('shutdownOrder: "lifo" tears down in reverse registration order', async () => {
    const life = createInitShutdown({ shutdownOrder: "lifo" });
    const order: string[] = [];
    life.onShutdown(() => {
      order.push("db"); // acquired first -> released last
    });
    life.onShutdown(() => {
      order.push("http");
    });
    await life.shutdown();
    expect(order).toEqual(["http", "db"]);
  });

  it("shutdown() is idempotent — callbacks run once", async () => {
    const life = createInitShutdown();
    let calls = 0;
    life.onShutdown(() => {
      calls++;
    });
    await life.shutdown();
    await life.shutdown();
    expect(calls).toBe(1);
  });
});

describe("init() is connect-once", () => {
  it("repeated init() calls run callbacks once (two entry points, one db.connect)", async () => {
    const life = createInitShutdown();
    let connects = 0;
    life.onInit(() => {
      connects++;
    });
    await life.init();
    await life.init();
    expect(connects).toBe(1);
  });

  it("concurrent first callers share one in-flight init", async () => {
    const life = createInitShutdown();
    let connects = 0;
    life.onInit(async () => {
      await new Promise((r) => setTimeout(r, 20));
      connects++;
    });
    await Promise.all([life.init(), life.init(), life.init()]);
    expect(connects).toBe(1);
  });

  it("a FAILED init clears the cache so the next call retries (no poisoned lifecycle)", async () => {
    const life = createInitShutdown();
    let attempts = 0;
    life.onInit(() => {
      attempts++;
      if (attempts === 1) {
        throw new Error("transient");
      }
    });
    await expect(life.init()).rejects.toThrow("transient");
    await expect(life.init()).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });
});
