import { createStore } from "zustand/vanilla";
import { combineSlices, createSlice, SliceCollisionError } from "../../../src/shared";

describe("slices uplift", () => {
  describe("createSlice deep isolation (frozen ref: shallow spread aliased nested refs)", () => {
    it("getInitialState calls never alias nested objects/arrays", () => {
      const s = createSlice({ user: { name: "a" }, tags: ["x"] }, () => ({}));
      const i1 = s.getInitialState();
      const i2 = s.getInitialState();
      i1.user.name = "CORRUPTED";
      i1.tags.push("LEAK");
      expect(i2.user.name).toBe("a");
      expect(i2.tags).toEqual(["x"]);
    });

    it("falls back to shallow copy for non-cloneable state values", () => {
      const fn = () => 1;
      const s = createSlice({ f: fn as unknown }, () => ({}));
      expect(s.getInitialState().f).toBe(fn);
    });
  });

  describe("typed actions without casts (frozen ref required `as Slice<SliceState, SliceActions>`)", () => {
    it("naturally typed actions compile and infer through combineSlices", () => {
      const counter = createSlice({ count: 0 }, (set) => ({
        inc: () => set((s) => ({ count: s.count + 1 })),
        setCount: (n: number) => set({ count: n }),
      }));
      const name = createSlice({ name: "" }, (set) => ({
        setName: (v: string) => set({ name: v }),
      }));
      const combined = combineSlices(counter, name);
      const state = combined.getInitialState();
      // Full inference: these are number/string, not unknown.
      const c: number = state.count;
      const n: string = state.name;
      expect(c).toBe(0);
      expect(n).toBe("");
      const actions = combined.getActions(() => undefined);
      // Parameter types survive: setCount takes a number.
      actions.setCount(5);
      // @ts-expect-error setCount does not accept a string — inference preserved
      const bad = () => actions.setCount("nope");
      expect(typeof bad).toBe("function");
    });
  });

  describe("collision detection (frozen ref: silent last-wins overwrite)", () => {
    it("throws SliceCollisionError on duplicate state keys at combine time", () => {
      const a = createSlice({ count: 0 }, () => ({}));
      const b = createSlice({ count: 999 }, () => ({}));
      expect(() => combineSlices(a, b)).toThrow(SliceCollisionError);
      try {
        combineSlices(a, b);
      } catch (e) {
        expect((e as SliceCollisionError).keys).toEqual(["count"]);
      }
    });

    it("throws SliceCollisionError on duplicate action keys at getActions time", () => {
      const a = createSlice({ x: 0 }, (set) => ({ reset: () => set({ x: 0 }) }));
      const b = createSlice({ y: 0 }, (set) => ({ reset: () => set({ y: 0 }) }));
      const combined = combineSlices(a, b);
      expect(() => combined.getActions(() => undefined)).toThrow(SliceCollisionError);
    });
  });

  describe("scoped set (frozen ref forwarded FULL combined state to slice updaters)", () => {
    it("functional updaters see only their own slice's keys", () => {
      let seenKeys: string[] = [];
      const a = createSlice({ aVal: 1 }, (set) => ({
        probe: () =>
          set((sliceState) => {
            seenKeys = Object.keys(sliceState);
            return { aVal: sliceState.aVal + 1 };
          }),
      }));
      const b = createSlice({ bVal: 42 }, () => ({}));
      const combined = combineSlices(a, b);
      const store = createStore(combined.toStateCreator());
      store.getState().probe();
      expect(seenKeys).toEqual(["aVal"]);
      expect(store.getState().aVal).toBe(2);
      expect(store.getState().bVal).toBe(42);
    });

    it("object partials still pass through directly", () => {
      const a = createSlice({ x: 0 }, (set) => ({
        setX: (n: number) => set({ x: n }),
      }));
      const set = jest.fn();
      combineSlices(a).getActions(set).setX(5);
      expect(set).toHaveBeenCalledWith({ x: 5 });
    });
  });

  describe("toStateCreator", () => {
    it("builds a working zustand store in one call", () => {
      const counter = createSlice({ count: 0 }, (set) => ({
        inc: () => set((s) => ({ count: s.count + 1 })),
      }));
      const label = createSlice({ label: "" }, (set) => ({
        setLabel: (v: string) => set({ label: v }),
      }));
      const store = createStore(combineSlices(counter, label).toStateCreator());
      store.getState().inc();
      store.getState().setLabel("hi");
      expect(store.getState().count).toBe(1);
      expect(store.getState().label).toBe("hi");
    });

    it("two stores from the same slices are fully independent", () => {
      const s = createSlice({ items: [] as string[] }, (set) => ({
        add: (v: string) => set((st) => ({ items: [...st.items, v] })),
      }));
      const combined = combineSlices(s);
      const store1 = createStore(combined.toStateCreator());
      const store2 = createStore(combined.toStateCreator());
      store1.getState().add("only-in-1");
      expect(store1.getState().items).toEqual(["only-in-1"]);
      expect(store2.getState().items).toEqual([]);
    });
  });
});
