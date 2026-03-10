/**
 * Typed store with createTypedStore and createSelector.
 */

import { createSelector, createTypedStore } from "@simpill/zustand.utils";

type CounterState = {
  count: number;
  name: string;
  increment: () => void;
  setName: (name: string) => void;
};

const useStore = createTypedStore<CounterState>((set) => ({
  count: 0,
  name: "",
  increment: () => set((s) => ({ count: s.count + 1 })),
  setName: (name: string) => set({ name }),
}));

const selectCount = createSelector<CounterState, number>((s) => s.count);

// In React: const count = useStore(selectCount);
const state = useStore.getState();
console.log(selectCount(state));
