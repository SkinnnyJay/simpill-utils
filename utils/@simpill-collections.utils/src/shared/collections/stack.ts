import type { ICollection } from "../contracts";
import { Deque } from "./deque";

/**
 * LIFO stack backed by a Deque. Iteration is lazy in LIFO order (top first);
 * previously each iteration allocated a full reversed array copy.
 */
export class Stack<T> implements ICollection<T> {
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
    return this._deque.toArray().reverse();
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this._deque.reversed();
  }

  push(value: T): void {
    this._deque.pushBack(value);
  }

  pop(): T | undefined {
    return this._deque.popBack();
  }

  peek(): T | undefined {
    return this._deque.peekBack();
  }
}
