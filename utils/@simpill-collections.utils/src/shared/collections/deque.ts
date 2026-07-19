import { VALUE_0 } from "../constants";
import type { ICollection } from "../contracts";

/**
 * Double-ended queue. O(1) push/pop front/back, O(1) random access via at().
 * Freed slots are cleared so popped objects are not retained (previously popped
 * references lived in the ring buffer until overwritten — a GC leak for
 * long-lived deques holding large objects). Iteration is lazy (no full-array
 * copy per iteration); do not mutate the deque while iterating.
 */
export class Deque<T> implements ICollection<T> {
  private _buffer: (T | undefined)[] = [];
  private _head = VALUE_0;
  private _size = VALUE_0;

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === VALUE_0;
  }

  clear(): void {
    this._buffer = [];
    this._head = VALUE_0;
    this._size = VALUE_0;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this._size; i++) {
      out.push(this._buffer[(this._head + i) % this._buffer.length] as T);
    }
    return out;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0; i < this._size; i++) {
      yield this._buffer[(this._head + i) % this._buffer.length] as T;
    }
  }

  /** Lazy reverse iteration, back to front. */
  *reversed(): IterableIterator<T> {
    for (let i = this._size - 1; i >= 0; i--) {
      yield this._buffer[(this._head + i) % this._buffer.length] as T;
    }
  }

  /** O(1) random access; undefined when out of range. */
  at(index: number): T | undefined {
    if (index < VALUE_0 || index >= this._size) return undefined;
    return this._buffer[(this._head + index) % this._buffer.length] as T;
  }

  pushBack(value: T): void {
    this.ensureCapacity(this._size + 1);
    const idx = (this._head + this._size) % this._buffer.length;
    this._buffer[idx] = value;
    this._size++;
  }

  pushFront(value: T): void {
    this.ensureCapacity(this._size + 1);
    this._head = (this._head - 1 + this._buffer.length) % this._buffer.length;
    this._buffer[this._head] = value;
    this._size++;
  }

  popBack(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const idx = (this._head + this._size - 1) % this._buffer.length;
    const value = this._buffer[idx] as T;
    this._buffer[idx] = undefined;
    this._size--;
    return value;
  }

  popFront(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const value = this._buffer[this._head] as T;
    this._buffer[this._head] = undefined;
    this._head = (this._head + 1) % this._buffer.length;
    this._size--;
    return value;
  }

  peekFront(): T | undefined {
    return this._size === VALUE_0 ? undefined : (this._buffer[this._head] as T);
  }

  peekBack(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const idx = (this._head + this._size - 1) % this._buffer.length;
    return this._buffer[idx] as T;
  }

  private ensureCapacity(required: number): void {
    if (required <= this._buffer.length) return;
    const newLen = Math.max(required, this._buffer.length * 2 || 4);
    const newBuf: (T | undefined)[] = new Array(newLen);
    for (let i = 0; i < this._size; i++) {
      newBuf[i] = this._buffer[(this._head + i) % this._buffer.length];
    }
    this._buffer = newBuf;
    this._head = 0;
  }
}
