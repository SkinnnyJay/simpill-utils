import { createTestPatterns } from "../../../src/shared/test-patterns";

describe("TestPatterns uplift", () => {
  describe("createFixture nested isolation", () => {
    // REGRESSION: { ...base, ...overrides } shallow-copied, so every fixture
    // aliased the SAME nested objects — mutating one corrupted all others.
    it("fixtures do not share nested objects with each other or the base", () => {
      const t = createTestPatterns();
      const base = { id: 1, prefs: { theme: "light", tags: ["a"] } };
      const fixture = t.createFixture(base);
      const u1 = fixture();
      const u2 = fixture();
      u1.prefs.theme = "dark";
      u1.prefs.tags.push("b");
      expect(u2.prefs.theme).toBe("light");
      expect(u2.prefs.tags).toEqual(["a"]);
      expect(base.prefs.theme).toBe("light");
      expect(base.prefs.tags).toEqual(["a"]);
    });

    it("clones Date/Map/Set, keeps functions and class instances by reference", () => {
      class Svc {}
      const svc = new Svc();
      const fn = (): number => 1;
      const t = createTestPatterns();
      const fixture = t.createFixture({
        when: new Date(0),
        m: new Map([["k", 1]]),
        s: new Set([1]),
        svc,
        fn,
      });
      const a = fixture();
      const b = fixture();
      expect(a.when).not.toBe(b.when);
      expect(a.when.getTime()).toBe(0);
      expect(a.m).not.toBe(b.m);
      a.m.set("k", 99);
      expect(b.m.get("k")).toBe(1);
      expect(a.s).not.toBe(b.s);
      expect(a.svc).toBe(svc);
      expect(a.fn).toBe(fn);
    });

    it("handles circular plain-object bases", () => {
      type Node = { name: string; self?: Node };
      const base: Node = { name: "n" };
      base.self = base;
      const t = createTestPatterns();
      const built = t.createFixture(base)();
      expect(built.self).toBe(built);
      expect(built).not.toBe(base);
    });

    it("supports function bases with a per-build sequence", () => {
      const t = createTestPatterns();
      const fixture = t.createFixture(({ sequence }) => ({
        id: sequence,
        email: `user${sequence}@example.com`,
      }));
      expect(fixture()).toEqual({ id: 1, email: "user1@example.com" });
      expect(fixture({ email: "x@example.com" })).toEqual({ id: 2, email: "x@example.com" });
    });

    it("override values are kept by reference", () => {
      const t = createTestPatterns();
      const fixture = t.createFixture({ cfg: { a: 1 } });
      const mine = { a: 2 };
      const built = fixture({ cfg: mine });
      expect(built.cfg).toBe(mine);
    });
  });

  describe("runTeardown", () => {
    // REGRESSION: teardowns ran FIFO; cleanup registries unwind LIFO
    // (vitest onTestFinished is "always called in reverse order", Go defer,
    // Python addCleanup) because later resources depend on earlier ones.
    it("runs teardowns in reverse registration order (LIFO)", async () => {
      const t = createTestPatterns();
      const order: string[] = [];
      t.addTeardown(() => {
        order.push("db");
      });
      t.addTeardown(() => {
        order.push("table");
      });
      t.addTeardown(() => {
        order.push("row");
      });
      await t.runTeardown();
      expect(order).toEqual(["row", "table", "db"]);
    });

    // REGRESSION: the first throwing teardown aborted the loop AND the list
    // had already been cleared — every remaining teardown was silently
    // dropped (leaked resources).
    it("runs ALL teardowns even when some throw, then rethrows", async () => {
      const t = createTestPatterns();
      const ran: string[] = [];
      t.addTeardown(() => {
        ran.push("first");
      });
      t.addTeardown(() => {
        throw new Error("boom");
      });
      t.addTeardown(() => {
        ran.push("last");
      });
      await expect(t.runTeardown()).rejects.toThrow("boom");
      expect(ran).toEqual(["last", "first"]);
    });

    it("aggregates multiple failures into an AggregateError", async () => {
      const t = createTestPatterns();
      t.addTeardown(() => {
        throw new Error("a");
      });
      t.addTeardown(async () => {
        throw new Error("b");
      });
      let caught: unknown;
      try {
        await t.runTeardown();
      } catch (err) {
        caught = err;
      }
      expect((caught as Error).name).toBe("AggregateError");
      expect(String(caught)).toContain("2 teardown(s) failed");
      const errors = (caught as Error & { errors: unknown[] }).errors as Error[];
      expect(errors.map((e) => e.message).sort()).toEqual(["a", "b"]);
    });

    it("clears the registry — second run is a no-op", async () => {
      const t = createTestPatterns();
      let count = 0;
      t.addTeardown(() => {
        count++;
      });
      await t.runTeardown();
      await t.runTeardown();
      expect(count).toBe(1);
    });

    it("awaits async teardowns", async () => {
      const t = createTestPatterns();
      const order: string[] = [];
      t.addTeardown(async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push("slow");
      });
      t.addTeardown(() => {
        order.push("fast");
      });
      await t.runTeardown();
      expect(order).toEqual(["fast", "slow"]);
    });
  });
});
