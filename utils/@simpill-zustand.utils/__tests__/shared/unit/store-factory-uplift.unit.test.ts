import { createMemoSelector, createTypedStore } from "../../../src/shared";

describe("store-factory uplift", () => {
  describe("createTypedStore two-arg form (the README's primary example never compiled)", () => {
    it("runs the README example verbatim", () => {
      // Copied from the frozen README "Usage" block, previously a type error.
      const useCounterStore = createTypedStore({ count: 0, name: "" }, (set) => ({
        increment: () => set((s) => ({ count: s.count + 1 })),
        setName: (name: string) => set({ name }),
      }));
      expect(useCounterStore.getState().count).toBe(0);
      useCounterStore.getState().increment();
      useCounterStore.getState().setName("lumen");
      expect(useCounterStore.getState().count).toBe(1);
      expect(useCounterStore.getState().name).toBe("lumen");
    });

    it("actions factory receives working get", () => {
      const store = createTypedStore({ n: 2 }, (set, get) => ({
        double: () => set({ n: get().n * 2 }),
      }));
      store.getState().double();
      expect(store.getState().n).toBe(4);
    });

    it("single-builder form is untouched", () => {
      const store = createTypedStore<{ count: number; inc: () => void }>((set) => ({
        count: 0,
        inc: () => set((s) => ({ count: s.count + 1 })),
      }));
      store.getState().inc();
      expect(store.getState().count).toBe(1);
    });
  });

  describe("createMemoSelector", () => {
    type S = { items: number[]; tax: number; noise: number };

    it("memoizes: combiner runs only when inputs change (Object.is)", () => {
      const selectTotal = createMemoSelector(
        [(s: S) => s.items, (s: S) => s.tax],
        (items, tax) => items.reduce((a, b) => a + b, 0) * (1 + tax)
      );
      const items = [1, 2, 3];
      const s1: S = { items, tax: 0.1, noise: 0 };
      expect(selectTotal(s1)).toBeCloseTo(6.6);
      expect(selectTotal.recomputations()).toBe(1);
      // Unrelated state change, same input refs -> no recompute, same result ref.
      const s2: S = { items, tax: 0.1, noise: 99 };
      expect(selectTotal(s2)).toBeCloseTo(6.6);
      expect(selectTotal.recomputations()).toBe(1);
      // Input change -> recompute.
      const s3: S = { items: [...items, 4], tax: 0.1, noise: 99 };
      expect(selectTotal(s3)).toBeCloseTo(11);
      expect(selectTotal.recomputations()).toBe(2);
    });

    it("returns a STABLE reference for object results while inputs are unchanged", () => {
      const sel = createMemoSelector([(s: S) => s.items], (items) => ({
        count: items.length,
      }));
      const items = [1];
      const a = sel({ items, tax: 0, noise: 0 });
      const b = sel({ items, tax: 0, noise: 1 });
      expect(a).toBe(b);
    });

    it("resetRecomputations works", () => {
      const sel = createMemoSelector([(s: S) => s.tax], (t) => t * 2);
      sel({ items: [], tax: 1, noise: 0 });
      sel.resetRecomputations();
      expect(sel.recomputations()).toBe(0);
    });
  });
});
