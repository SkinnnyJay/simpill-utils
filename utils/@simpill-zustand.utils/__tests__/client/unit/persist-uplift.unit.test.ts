import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import {
  createInMemoryStorage,
  whenHydrated,
  withPersist,
  withPersistClientOnly,
} from "../../../src/client";

type Counter = { n: number; inc: () => void };
const counterBuilder = (set: (fn: (s: Counter) => Partial<Counter>) => void): Counter => ({
  n: 0,
  inc: () => set((s) => ({ n: s.n + 1 })),
});

describe("persist uplift", () => {
  describe("server crash regression (frozen ref: `{} as Storage`)", () => {
    it("withPersist store WRITES do not throw when localStorage is absent", () => {
      // Jest node env: typeof localStorage === 'undefined' — the exact branch
      // the frozen ref guarded, then crashed anyway with
      // "storage.setItem is not a function" on every set().
      expect(typeof localStorage).toBe("undefined");
      const store = createStore(
        persist<Counter>(counterBuilder as never, withPersist<Counter>("crash-a") as never)
      );
      expect(() => store.getState().inc()).not.toThrow();
      expect(store.getState().n).toBe(1);
    });

    it("hydration completes (hasHydrated true) with the noop server storage", async () => {
      const store = createStore(
        persist<Counter>(counterBuilder as never, withPersist<Counter>("crash-b") as never)
      );
      await whenHydrated(store as never);
      expect(
        (store as unknown as { persist: { hasHydrated: () => boolean } }).persist.hasHydrated()
      ).toBe(true);
    });
  });

  describe("option passthrough (frozen ref dropped partialize; merge/onRehydrateStorage/skipHydration missing)", () => {
    it("partialize is honored: only selected keys are persisted", () => {
      type S = { keep: number; drop: string; bump: () => void };
      const storage = createInMemoryStorage<S>();
      const opts = withPersist<S>("part2", { partialize: (s) => ({ keep: s.keep }) });
      opts.storage = storage;
      const store2 = createStore(
        persist<S>(
          (set) => ({
            keep: 0,
            drop: "secret",
            bump: () => set((s) => ({ keep: s.keep + 1 })),
          }),
          opts as never
        )
      );
      store2.getState().bump();
      const stored = storage.getItem("part2") as { state: Record<string, unknown> };
      expect(stored.state).toEqual({ keep: 1 });
      expect("drop" in stored.state).toBe(false);
    });

    it("skipHydration is passed through: store does not auto-hydrate", () => {
      const storage = createInMemoryStorage<{ n: number }>();
      storage.setItem("skip", { state: { n: 77 }, version: 1 });
      const opts = withPersist<{ n: number }>("skip", { skipHydration: true });
      opts.storage = storage as never;
      const store = createStore(persist(() => ({ n: 0 }), opts as never));
      expect(store.getState().n).toBe(0); // not hydrated
      const api = store as unknown as {
        persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean };
      };
      expect(api.persist.hasHydrated()).toBe(false);
    });

    it("onRehydrateStorage is passed through and fires after hydrate", async () => {
      const storage = createInMemoryStorage<{ n: number }>();
      storage.setItem("rehydrate-cb", { state: { n: 5 }, version: 1 });
      const calls: Array<{ n?: number }> = [];
      const opts = withPersist<{ n: number }>("rehydrate-cb", {
        onRehydrateStorage: () => (state) => {
          calls.push({ n: state?.n });
        },
      });
      opts.storage = storage as never;
      const store = createStore(persist(() => ({ n: 0 }), opts as never));
      await whenHydrated(store as never);
      expect(calls).toEqual([{ n: 5 }]);
      expect(store.getState().n).toBe(5);
    });

    it("merge is passed through and controls rehydration merging", async () => {
      const storage = createInMemoryStorage<{ n: number; local: string }>();
      storage.setItem("merge-t", { state: { n: 9 } as never, version: 1 });
      const opts = withPersist<{ n: number; local: string }>("merge-t", {
        merge: (persisted, current) => ({
          ...current,
          ...(persisted as { n: number }),
          local: `${current.local}+merged`,
        }),
      });
      opts.storage = storage as never;
      const store = createStore(persist(() => ({ n: 0, local: "x" }), opts as never));
      await whenHydrated(store as never);
      expect(store.getState().n).toBe(9);
      expect(store.getState().local).toBe("x+merged");
    });

    it("withPersistClientOnly passes the new options through too", () => {
      const opts = withPersistClientOnly<{ n: number }>("wco", {
        skipHydration: true,
        partialize: (s) => ({ n: s.n }),
      });
      expect(opts.skipHydration).toBe(true);
      expect(typeof opts.partialize).toBe("function");
    });

    it("options object stays byte-compatible when new options are unused", () => {
      const opts = withPersist<{ n: number }>("compat", { version: 2 });
      expect(Object.keys(opts).sort()).toEqual(["migrate", "name", "storage", "version"]);
    });
  });

  describe("createInMemoryStorage", () => {
    it("round-trips values with JSON semantics (matches createJSONStorage(localStorage))", () => {
      const storage = createInMemoryStorage<{ d: string; n: number }>();
      storage.setItem("k", { state: { d: "x", n: 1 }, version: 1 });
      expect(storage.getItem("k")).toEqual({ state: { d: "x", n: 1 }, version: 1 });
      expect(storage.size).toBe(1);
      storage.removeItem("k");
      expect(storage.getItem("k")).toBeNull();
      expect(storage.size).toBe(0);
    });

    it("stored values are isolated from later mutation (JSON round-trip, not by-ref)", () => {
      const storage = createInMemoryStorage<{ arr: number[] }>();
      const value = { state: { arr: [1] }, version: 1 };
      storage.setItem("iso", value);
      value.state.arr.push(2);
      expect((storage.getItem("iso") as { state: { arr: number[] } }).state.arr).toEqual([1]);
    });

    it("clear empties the store", () => {
      const storage = createInMemoryStorage<{ n: number }>();
      storage.setItem("a", { state: { n: 1 }, version: 1 });
      storage.setItem("b", { state: { n: 2 }, version: 1 });
      storage.clear();
      expect(storage.size).toBe(0);
    });
  });

  describe("whenHydrated", () => {
    it("resolves immediately if the store already hydrated", async () => {
      const storage = createInMemoryStorage<{ n: number }>();
      const opts = withPersist<{ n: number }>("wh-immediate");
      opts.storage = storage as never;
      const store = createStore(persist(() => ({ n: 0 }), opts as never));
      // In-memory storage is synchronous — hydration is already done.
      await expect(whenHydrated(store as never)).resolves.toBeUndefined();
    });

    it("resolves after manual rehydrate when skipHydration is set", async () => {
      const storage = createInMemoryStorage<{ n: number }>();
      storage.setItem("wh-manual", { state: { n: 3 }, version: 1 });
      const opts = withPersist<{ n: number }>("wh-manual", { skipHydration: true });
      opts.storage = storage as never;
      const store = createStore(persist(() => ({ n: 0 }), opts as never));
      const api = store as unknown as { persist: { rehydrate: () => unknown } };
      const hydrated = whenHydrated(store as never);
      api.persist.rehydrate();
      await hydrated;
      expect(store.getState().n).toBe(3);
    });
  });
});
