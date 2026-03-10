import { VALUE_0 } from "../constants";
import type { ICollection } from "../contracts";

/**
 * Double-ended queue. O(1) push/pop front/back.
 */
export class Deque<T> implements ICollection<T> {
  private _buffer: T[] = [];
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

  [Symbol.iterator](): Iterator<T> {
    return this.toArray()[Symbol.iterator]();
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
    const value = this._buffer[idx];
    this._size--;
    return value;
  }

  popFront(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const value = this._buffer[this._head];
    this._head = (this._head + 1) % this._buffer.length;
    this._size--;
    return value;
  }

  peekFront(): T | undefined {
    return this._size === VALUE_0 ? undefined : this._buffer[this._head];
  }

  peekBack(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const idx = (this._head + this._size - 1) % this._buffer.length;
    return this._buffer[idx];
  }

  private ensureCapacity(required: number): void {
    if (required <= this._buffer.length) return;
    const newLen = Math.max(required, this._buffer.length * 2 || 4);
    const newBuf: T[] = new Array(newLen);
    for (let i = 0; i < this._size; i++) {
      newBuf[i] = this._buffer[(this._head + i) % this._buffer.length] as T;
    }
    this._buffer = newBuf;
    this._head = 0;
  }
}
