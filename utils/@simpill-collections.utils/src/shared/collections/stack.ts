import type { ICollection } from "../contracts";
import { Deque } from "./deque";

/**
 * LIFO stack backed by a Deque.
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

  [Symbol.iterator](): Iterator<T> {
    return this.toArray()[Symbol.iterator]();
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
