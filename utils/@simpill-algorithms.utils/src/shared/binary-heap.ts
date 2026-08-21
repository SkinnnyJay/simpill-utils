/** Binary min-heap on a comparator; the smallest element (per compare) is popped first. */
import type { CompareFn } from "./sort";

/**
 * Binary heap / priority queue. `compare(a, b) < 0` means `a` has higher
 * priority (is popped first) — pass `(a, b) => a - b` for a min-heap of
 * numbers, invert for a max-heap.
 *
 * push/pop are O(log n), peek is O(1), and constructing from an existing
 * array uses O(n) bottom-up heapify (not n pushes, which would be O(n log n)).
 */
export class BinaryHeap<T> {
  private readonly compare: CompareFn<T>;
  private readonly items: T[];

  constructor(compare: CompareFn<T>, items?: Iterable<T>) {
    this.compare = compare;
    this.items = items ? Array.from(items) : [];
    if (this.items.length > 1) {
      for (let i = (this.items.length >>> 1) - 1; i >= 0; i--) {
        this.siftDown(i);
      }
    }
  }

  /** Number of elements in the heap. */
  get size(): number {
    return this.items.length;
  }

  /** True when the heap has no elements. */
  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** Highest-priority element without removing it, or undefined when empty. O(1). */
  peek(): T | undefined {
    return this.items[0];
  }

  /** Insert an element. O(log n). */
  push(value: T): void {
    this.items.push(value);
    this.siftUp(this.items.length - 1);
  }

  /** Remove and return the highest-priority element, or undefined when empty. O(log n). */
  pop(): T | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0 && last !== undefined) {
      items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** Push then pop in one step; cheaper than push() followed by pop(). */
  pushPop(value: T): T {
    const items = this.items;
    if (items.length === 0 || this.compare(value, items[0] as T) <= 0) {
      return value;
    }
    const top = items[0] as T;
    items[0] = value;
    this.siftDown(0);
    return top;
  }

  /** Remove all elements. */
  clear(): void {
    this.items.length = 0;
  }

  /** Shallow copy of the backing array (heap order, NOT sorted order). */
  toArray(): T[] {
    return this.items.slice();
  }

  /** Iterates by repeatedly popping a copy: yields elements in priority order without mutating the heap. */
  *[Symbol.iterator](): Iterator<T> {
    const copy = new BinaryHeap(this.compare, this.items);
    while (!copy.isEmpty) {
      yield copy.pop() as T;
    }
  }

  private siftUp(index: number): void {
    const items = this.items;
    const value = items[index] as T;
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (this.compare(value, items[parent] as T) >= 0) break;
      items[i] = items[parent] as T;
      i = parent;
    }
    items[i] = value;
  }

  private siftDown(index: number): void {
    const items = this.items;
    const n = items.length;
    const value = items[index] as T;
    let i = index;
    while (true) {
      const left = 2 * i + 1;
      if (left >= n) break;
      const right = left + 1;
      const child =
        right < n && this.compare(items[right] as T, items[left] as T) < 0 ? right : left;
      if (this.compare(items[child] as T, value) >= 0) break;
      items[i] = items[child] as T;
      i = child;
    }
    items[i] = value;
  }
}
