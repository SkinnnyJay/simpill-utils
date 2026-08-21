/**
 * @file Deque unit tests
 */

import { Deque } from "../../../src/shared/collections/deque";

describe("Deque", () => {
  it("starts empty", () => {
    const d = new Deque<number>();
    expect(d.size).toBe(0);
    expect(d.isEmpty()).toBe(true);
  });

  it("pushBack and popFront", () => {
    const d = new Deque<number>();
    d.pushBack(1);
    d.pushBack(2);
    expect(d.popFront()).toBe(1);
    expect(d.popFront()).toBe(2);
    expect(d.popFront()).toBeUndefined();
  });

  it("pushFront and popBack", () => {
    const d = new Deque<number>();
    d.pushFront(1);
    d.pushFront(2);
    expect(d.popBack()).toBe(1);
    expect(d.popBack()).toBe(2);
  });

  it("peekFront and peekBack", () => {
    const d = new Deque<number>();
    d.pushBack(1);
    d.pushBack(2);
    expect(d.peekFront()).toBe(1);
    expect(d.peekBack()).toBe(2);
    expect(d.size).toBe(2);
  });

  it("clear and toArray", () => {
    const d = new Deque<number>();
    d.pushBack(1);
    d.pushBack(2);
    d.clear();
    expect(d.toArray()).toEqual([]);
  });

  it("toArray when empty", () => {
    const d = new Deque<number>();
    expect(d.toArray()).toEqual([]);
  });

  it("mixed pushFront pushBack and toArray order", () => {
    const d = new Deque<number>();
    d.pushBack(2);
    d.pushFront(1);
    d.pushBack(3);
    expect(d.toArray()).toEqual([1, 2, 3]);
  });
});

describe("Deque (uplift)", () => {
  it("at() gives O(1) random access with bounds", () => {
    const d = new Deque<number>();
    d.pushBack(2);
    d.pushBack(3);
    d.pushFront(1); // wraps head
    expect(d.at(0)).toBe(1);
    expect(d.at(1)).toBe(2);
    expect(d.at(2)).toBe(3);
    expect(d.at(3)).toBeUndefined();
    expect(d.at(-1)).toBeUndefined();
  });

  it("iterates lazily front-to-back and reversed()", () => {
    const d = new Deque<number>();
    for (const x of [1, 2, 3]) d.pushBack(x);
    expect([...d]).toEqual([1, 2, 3]);
    expect([...d.reversed()]).toEqual([3, 2, 1]);
  });
});
