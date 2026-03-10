/**
 * @file LinkedList unit tests
 */

import { LinkedList } from "../../../src/shared/collections/linked-list";

describe("LinkedList", () => {
  it("starts empty", () => {
    const list = new LinkedList<number>();
    expect(list.size).toBe(0);
    expect(list.isEmpty()).toBe(true);
    expect(list.toArray()).toEqual([]);
  });

  it("push and pop", () => {
    const list = new LinkedList<number>();
    list.push(1);
    list.push(2);
    list.push(3);
    expect(list.size).toBe(3);
    expect(list.pop()).toBe(3);
    expect(list.pop()).toBe(2);
    expect(list.pop()).toBe(1);
    expect(list.pop()).toBeUndefined();
    expect(list.isEmpty()).toBe(true);
  });

  it("unshift and shift", () => {
    const list = new LinkedList<string>();
    list.unshift("a");
    list.unshift("b");
    expect(list.size).toBe(2);
    expect(list.shift()).toBe("b");
    expect(list.shift()).toBe("a");
    expect(list.shift()).toBeUndefined();
  });

  it("get and set", () => {
    const list = LinkedList.fromArray([10, 20, 30]);
    expect(list.get(0)).toBe(10);
    expect(list.get(1)).toBe(20);
    expect(list.get(2)).toBe(30);
    expect(list.get(-1)).toBeUndefined();
    expect(list.get(10)).toBeUndefined();
    list.set(1, 99);
    expect(list.get(1)).toBe(99);
  });

  it("insertAt and removeAt", () => {
    const list = new LinkedList<number>();
    list.push(1);
    list.push(3);
    list.insertAt(1, 2);
    expect(list.toArray()).toEqual([1, 2, 3]);
    expect(list.removeAt(1)).toBe(2);
    expect(list.toArray()).toEqual([1, 3]);
  });

  it("clear", () => {
    const list = LinkedList.fromArray([1, 2, 3]);
    list.clear();
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it("is iterable", () => {
    const list = LinkedList.fromArray([1, 2, 3]);
    expect([...list]).toEqual([1, 2, 3]);
  });

  it("insertAt at head uses unshift", () => {
    const list = LinkedList.fromArray([2, 3]);
    list.insertAt(0, 1);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it("insertAt at tail uses push", () => {
    const list = LinkedList.fromArray([1, 2]);
    list.insertAt(2, 3);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it("removeAt at head returns shift", () => {
    const list = LinkedList.fromArray([1, 2, 3]);
    expect(list.removeAt(0)).toBe(1);
    expect(list.toArray()).toEqual([2, 3]);
  });

  it("removeAt at tail returns pop", () => {
    const list = LinkedList.fromArray([1, 2, 3]);
    expect(list.removeAt(2)).toBe(3);
    expect(list.toArray()).toEqual([1, 2]);
  });
});
