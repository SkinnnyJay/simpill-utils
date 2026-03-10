import { VALUE_0 } from "../constants";
import type { ICollection } from "../contracts";

/**
 * TypedSet: Set with optional custom equality and/or validator.
 */
export interface TypedSetOptions<T> {
  equals?: (a: T, b: T) => boolean;
  validate?: (value: T) => boolean;
}

export class TypedSet<T> implements ICollection<T> {
  private readonly _items: T[] = [];
  private readonly _equals: (a: T, b: T) => boolean;
  private readonly _validate: ((value: T) => boolean) | undefined;

  constructor(options: TypedSetOptions<T> = {}) {
    this._equals = options.equals ?? ((a, b) => a === b);
    this._validate = options.validate;
  }

  get size(): number {
    return this._items.length;
  }

  isEmpty(): boolean {
    return this._items.length === VALUE_0;
  }

  clear(): void {
    this._items.length = 0;
  }

  toArray(): T[] {
    return [...this._items];
  }

  [Symbol.iterator](): Iterator<T> {
    return this._items[Symbol.iterator]();
  }

  add(value: T): this {
    if (this._validate && !this._validate(value)) return this;
    if (!this.has(value)) this._items.push(value);
    return this;
  }

  has(value: T): boolean {
    return this._items.some((x) => this._equals(x, value));
  }

  delete(value: T): boolean {
    const i = this._items.findIndex((x) => this._equals(x, value));
    if (i === -1) return false;
    this._items.splice(i, 1);
    return true;
  }

  forEach(cb: (value: T, valueAgain: T, set: TypedSet<T>) => void): void {
    for (const v of this._items) cb(v, v, this);
  }
}
