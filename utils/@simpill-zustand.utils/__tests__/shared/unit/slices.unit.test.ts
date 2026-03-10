import type { Slice, SliceActions, SliceState } from "../../../src/shared";
import { combineSlices, createSlice } from "../../../src/shared";

describe("slices", () => {
  describe("createSlice", () => {
    it("returns initial state and actions factory", () => {
      const counterSlice = createSlice({ count: 0 }, (set) => ({
        inc: () => set((s) => ({ count: s.count + 1 })),
      }));
      expect(counterSlice.getInitialState()).toEqual({ count: 0 });
      const set = jest.fn();
      const actions = counterSlice.actions(set);
      expect(actions.inc).toBeDefined();
      actions.inc();
      expect(set).toHaveBeenCalled();
    });
  });

  describe("combineSlices", () => {
    it("merges initial state from multiple slices", () => {
      const a = createSlice({ x: 1 }, () => ({})) as Slice<SliceState, SliceActions>;
      const b = createSlice({ y: 2 }, () => ({})) as Slice<SliceState, SliceActions>;
      const combined = combineSlices(a, b);
      const state = combined.getInitialState();
      expect(state).toEqual({ x: 1, y: 2 });
    });
    it("getActions returns merged actions that call set", () => {
      const a = createSlice({ x: 0 }, (set) => ({
        setX: (n: unknown) => set({ x: n as number }),
      })) as Slice<SliceState, SliceActions>;
      const combined = combineSlices(a);
      const set = jest.fn();
      const actions = combined.getActions(set);
      expect(actions.setX).toBeDefined();
      (actions.setX as (n: number) => void)(5);
      expect(set).toHaveBeenCalledWith({ x: 5 });
    });
  });
});
