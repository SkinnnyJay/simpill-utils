import { ERROR_CIRCULAR_BUFFER_CAPACITY, VALUE_0, VALUE_1 } from "../constants";
import type { ICollection } from "../contracts";

/**
 * Fixed-capacity ring buffer. Oldest entries dropped when full.
 */
export class CircularBuffer<T> implements ICollection<T> {
  private readonly _buffer: T[];
  private _head = VALUE_0;
  private _size = VALUE_0;
  private readonly _capacity: number;

  constructor(capacity: number) {
    if (capacity < VALUE_1) throw new RangeError(ERROR_CIRCULAR_BUFFER_CAPACITY);
    this._capacity = capacity;
    this._buffer = new Array(capacity);
  }

  get size(): number {
    return this._size;
  }

  get capacity(): number {
    return this._capacity;
  }

  isEmpty(): boolean {
    return this._size === VALUE_0;
  }

  isFull(): boolean {
    return this._size === this._capacity;
  }

  clear(): void {
    this._head = VALUE_0;
    this._size = VALUE_0;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this._size; i++) {
      out.push(this._buffer[(this._head + i) % this._capacity] as T);
    }
    return out;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.toArray()[Symbol.iterator]();
  }

  push(value: T): void {
    const idx = (this._head + this._size) % this._capacity;
    this._buffer[idx] = value;
    if (this._size < this._capacity) {
      this._size++;
    } else {
      this._head = (this._head + 1) % this._capacity;
    }
  }

  shift(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const value = this._buffer[this._head];
    this._head = (this._head + 1) % this._capacity;
    this._size--;
    return value;
  }

  peekFront(): T | undefined {
    return this._size === VALUE_0 ? undefined : this._buffer[this._head];
  }

  peekBack(): T | undefined {
    if (this._size === VALUE_0) return undefined;
    const idx = (this._head + this._size - 1) % this._capacity;
    return this._buffer[idx];
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    return this._buffer[(this._head + index) % this._capacity];
  }
}
