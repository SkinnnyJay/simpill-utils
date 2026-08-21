import { BinaryHeap } from "../../../src/shared/binary-heap";

const numCmp = (a: number, b: number) => a - b;

const makeRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

describe("BinaryHeap", () => {
  it("pops in priority order", () => {
    const heap = new BinaryHeap(numCmp);
    for (const v of [5, 1, 4, 2, 3]) heap.push(v);
    const out: number[] = [];
    while (!heap.isEmpty) out.push(heap.pop() as number);
    expect(out).toEqual([1, 2, 3, 4, 5]);
  });

  it("heapifies an existing array in the constructor", () => {
    const heap = new BinaryHeap(numCmp, [9, 3, 7, 1, 5]);
    expect(heap.size).toBe(5);
    expect(heap.peek()).toBe(1);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(3);
  });

  it("works as a max-heap with an inverted comparator", () => {
    const heap = new BinaryHeap<number>((a, b) => b - a, [2, 8, 5]);
    expect(heap.pop()).toBe(8);
    expect(heap.pop()).toBe(5);
    expect(heap.pop()).toBe(2);
    expect(heap.pop()).toBeUndefined();
  });

  it("peek/pop on empty heap return undefined", () => {
    const heap = new BinaryHeap(numCmp);
    expect(heap.peek()).toBeUndefined();
    expect(heap.pop()).toBeUndefined();
    expect(heap.isEmpty).toBe(true);
  });

  it("pushPop returns the incoming value when it wins, else swaps with the top", () => {
    const heap = new BinaryHeap(numCmp, [3, 5, 7]);
    expect(heap.pushPop(1)).toBe(1);
    expect(heap.size).toBe(3);
    expect(heap.pushPop(9)).toBe(3);
    expect(heap.peek()).toBe(5);
    expect(heap.size).toBe(3);
  });

  it("clear empties the heap", () => {
    const heap = new BinaryHeap(numCmp, [1, 2]);
    heap.clear();
    expect(heap.size).toBe(0);
    expect(heap.pop()).toBeUndefined();
  });

  it("iterates in priority order without consuming the heap", () => {
    const heap = new BinaryHeap(numCmp, [4, 1, 3, 2]);
    expect([...heap]).toEqual([1, 2, 3, 4]);
    expect(heap.size).toBe(4);
    expect([...heap]).toEqual([1, 2, 3, 4]);
  });

  it("supports stable priority handling with tie-broken comparator", () => {
    type Job = { priority: number; seq: number };
    const heap = new BinaryHeap<Job>((a, b) => a.priority - b.priority || a.seq - b.seq);
    heap.push({ priority: 1, seq: 2 });
    heap.push({ priority: 0, seq: 3 });
    heap.push({ priority: 1, seq: 1 });
    expect(heap.pop()).toEqual({ priority: 0, seq: 3 });
    expect(heap.pop()).toEqual({ priority: 1, seq: 1 });
    expect(heap.pop()).toEqual({ priority: 1, seq: 2 });
  });

  it.each([101, 202, 303])("property: pop sequence equals sorted oracle (seed %i)", (seed) => {
    const rng = makeRng(seed);
    for (let round = 0; round < 10; round++) {
      const n = Math.floor(rng() * 300);
      const values = Array.from({ length: n }, () => Math.floor(rng() * 1000));
      const heap = new BinaryHeap(numCmp, values);
      const out: number[] = [];
      while (!heap.isEmpty) out.push(heap.pop() as number);
      expect(out).toEqual(values.slice().sort(numCmp));
    }
  });

  it.each([404, 505])("property: interleaved push/pop matches oracle (seed %i)", (seed) => {
    const rng = makeRng(seed);
    const heap = new BinaryHeap(numCmp);
    const oracle: number[] = [];
    for (let op = 0; op < 500; op++) {
      if (rng() < 0.6 || oracle.length === 0) {
        const v = Math.floor(rng() * 1000);
        heap.push(v);
        oracle.push(v);
        oracle.sort(numCmp);
      } else {
        expect(heap.pop()).toBe(oracle.shift());
      }
      expect(heap.size).toBe(oracle.length);
      expect(heap.peek()).toBe(oracle[0]);
    }
  });
});
