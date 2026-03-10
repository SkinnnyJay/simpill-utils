import type { ICollection } from "../contracts";
import { Deque } from "./deque";

/**
 * FIFO queue backed by a Deque.
 */
export class Queue<T> implements ICollection<T> {
  private readonly _deque = new Deque<T>();

  get size(): number {
    return this._deque.size;
  }

  isEmpty(): boolean {
    return this._deque.isEmpty();
  }

  clear(): void {
    this._deque.clear();
  }

  toArray(): T[] {
    return this._deque.toArray();
  }

  [Symbol.iterator](): Iterator<T> {
    return this._deque[Symbol.iterator]();
  }

  enqueue(value: T): void {
    this._deque.pushBack(value);
  }

  dequeue(): T | undefined {
    return this._deque.popFront();
  }

  peek(): T | undefined {
    return this._deque.peekFront();
  }
}
