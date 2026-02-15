/**
 * @file Queue and Stack unit tests
 */

import { Queue } from "../../../src/shared/collections/queue";
import { Stack } from "../../../src/shared/collections/stack";

describe("Queue", () => {
  it("FIFO order", () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.dequeue()).toBe(1);
    expect(q.dequeue()).toBe(2);
    expect(q.peek()).toBe(3);
    expect(q.dequeue()).toBe(3);
    expect(q.dequeue()).toBeUndefined();
  });

  it("isEmpty and clear", () => {
    const q = new Queue<string>();
    expect(q.isEmpty()).toBe(true);
    q.enqueue("a");
    q.clear();
    expect(q.isEmpty()).toBe(true);
  });

  it("toArray and iterator", () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    expect(q.toArray()).toEqual([1, 2]);
    expect([...q]).toEqual([1, 2]);
  });
});

describe("Stack", () => {
  it("LIFO order", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    s.push(3);
    expect(s.pop()).toBe(3);
    expect(s.peek()).toBe(2);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
    expect(s.pop()).toBeUndefined();
  });

  it("toArray is LIFO order", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    expect(s.toArray()).toEqual([2, 1]);
  });

  it("iterator and size", () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    expect([...s]).toEqual([2, 1]);
    expect(s.size).toBe(2);
  });
});
