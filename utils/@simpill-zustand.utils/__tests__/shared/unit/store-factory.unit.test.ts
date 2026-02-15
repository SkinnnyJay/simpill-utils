import { createSelector, createTypedStore } from "../../../src/shared";

describe("store-factory", () => {
  describe("createTypedStore", () => {
    it("creates store with state and actions", () => {
      const useStore = createTypedStore<{ count: number; inc: () => void }>((set) => ({
        count: 0,
        inc: () => set((s) => ({ count: s.count + 1 })),
      }));
      const state = useStore.getState();
      expect(state.count).toBe(0);
      state.inc();
      expect(useStore.getState().count).toBe(1);
    });
  });

  describe("createSelector", () => {
    it("returns selector function", () => {
      const selectCount = createSelector<{ count: number }, number>((s) => s.count);
      expect(selectCount({ count: 42 })).toBe(42);
    });
  });
});
