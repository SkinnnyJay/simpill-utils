import { createAppStore, createInMemoryStorage, whenHydrated } from "../../../src/client";

describe("createAppStore uplift", () => {
  it("persist API is TYPED on the return value — no casts (frozen ref erased it)", async () => {
    const storage = createInMemoryStorage<{ n: number }>();
    const useStore = createAppStore<{ n: number; inc: () => void }>(
      (set) => ({ n: 0, inc: () => set((s) => ({ n: s.n + 1 })) }),
      { persist: { name: "typed-persist", version: 1, storage: storage as never } }
    );
    // These property accesses are the point: they compile without `as`.
    expect(typeof useStore.persist.hasHydrated).toBe("function");
    expect(typeof useStore.persist.rehydrate).toBe("function");
    await whenHydrated(useStore);
    expect(useStore.persist.hasHydrated()).toBe(true);
    useStore.getState().inc();
    const stored = storage.getItem("typed-persist") as { state: { n: number } };
    expect(stored.state.n).toBe(1);
  });

  it("without persist options the plain store type is returned (originals untouched)", () => {
    const useStore = createAppStore<{ x: number; setX: (n: number) => void }>((set) => ({
      x: 0,
      setX: (n: number) => set({ x: n }),
    }));
    useStore.getState().setX(2);
    expect(useStore.getState().x).toBe(2);
  });
});
