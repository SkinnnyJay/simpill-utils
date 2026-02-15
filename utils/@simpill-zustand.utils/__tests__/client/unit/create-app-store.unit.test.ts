import { createAppStore } from "../../../src/client";

describe("createAppStore client", () => {
  it("creates store without options", () => {
    const useStore = createAppStore<{
      count: number;
      setCount: (n: number) => void;
    }>((set) => ({
      count: 0,
      setCount: (n: number) => set({ count: n }),
    }));
    expect(useStore.getState().count).toBe(0);
    useStore.getState().setCount(5);
    expect(useStore.getState().count).toBe(5);
  });

  it("creates store with devtools options", () => {
    const useStore = createAppStore<{ x: number; setX: (n: number) => void }>(
      (set) => ({ x: 0, setX: (n: number) => set({ x: n }) }),
      { devtools: { name: "TestStore" } }
    );
    expect(useStore.getState().x).toBe(0);
  });

  it("creates store with persist options", () => {
    const useStore = createAppStore<{ n: number }>((_set) => ({ n: 0 }), {
      persist: { name: "test-persist", version: 1, storage: createNoopStorage() },
    });
    expect(useStore.getState().n).toBe(0);
  });
});

function createNoopStorage() {
  return {
    getItem: () => null,
    setItem: () => {
      /* noop */
    },
    removeItem: () => {
      /* noop */
    },
  };
}
