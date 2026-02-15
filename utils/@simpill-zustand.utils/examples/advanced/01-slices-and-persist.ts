/**
 * Slices and persist: createSlice, combineSlices, withPersist.
 */

import { combineSlices, createSlice, withPersist } from "@simpill/zustand.utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const counterSlice = createSlice({ count: 0 }, (set) => ({
  increment: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}));

const nameSlice = createSlice({ name: "" }, (set) => ({
  setName: (name: string) => set({ name }),
}));

const combined = combineSlices(counterSlice, nameSlice);

type State = ReturnType<typeof combined.getInitialState> & ReturnType<typeof combined.getActions>;

const useAppStore = create<State>()(
  persist(
    (set) => ({
      ...combined.getInitialState(),
      ...combined.getActions(set),
    }),
    withPersist("app-store", { version: 1 })
  )
);

// With devtools: wrap with devtools(..., withDevtools('AppStore'))
export { useAppStore };
