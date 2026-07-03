import { createMetadataStore } from "../../../src/shared/metadata-store";

/** Seeded LCG so failures are reproducible. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("MetadataStore model-based property test", () => {
  it("behaves identically to a plain Map over 5000 random operations", () => {
    const rand = lcg(0xa11071e5);
    const store = createMetadataStore();
    const model = new Map<string | symbol, unknown>();
    const symbols = [Symbol("s0"), Symbol("s1"), Symbol("s2")];
    const keyPool: Array<string | symbol> = ["a", "b", "c", "d", "e", ...symbols];
    const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)] as T;

    for (let i = 0; i < 5000; i++) {
      const key = pick(keyPool);
      const op = Math.floor(rand() * 6);
      if (op === 0) {
        const value = rand();
        store.set(key, value);
        model.set(key, value);
      } else if (op === 1) {
        expect(store.get(key)).toBe(model.get(key));
      } else if (op === 2) {
        expect(store.has(key)).toBe(model.has(key));
      } else if (op === 3) {
        expect(store.delete(key)).toBe(model.delete(key));
      } else if (op === 4) {
        const factory = (): number => i;
        const expected = model.has(key) ? model.get(key) : i;
        if (!model.has(key)) {
          model.set(key, i);
        }
        expect(store.getOrSet(key, factory)).toBe(expected);
      } else {
        expect(store.size).toBe(model.size);
      }
    }
    // Final state equivalence, including iteration order.
    expect(Array.from(store.entries())).toEqual(Array.from(model.entries()));
    expect(Array.from(store.keys())).toEqual(Array.from(model.keys()));
  });
});
