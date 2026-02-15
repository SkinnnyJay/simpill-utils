/**
 * @simpill/collections.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  BiMap,
  CircularBuffer,
  Deque,
  LinkedList,
  LRUCache,
  MultiMap,
  OrderedMap,
  Queue,
  Stack,
  TTLCache,
  TypedSet,
  Vector,
} from "@simpill/collections.utils";

// Queue (FIFO) and Stack (LIFO)
const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
console.log("Queue dequeue:", queue.dequeue(), queue.dequeue());

const stack = new Stack<string>();
stack.push("a");
stack.push("b");
console.log("Stack pop:", stack.pop(), stack.pop());

// LinkedList
const list = LinkedList.fromArray([1, 2, 3]);
list.push(4);
list.unshift(0);
console.log("LinkedList:", list.toArray());

// Vector
const v = new Vector<number>(4);
v.push(10);
v.push(20);
console.log("Vector get(0), at(-1):", v.get(0), v.at(-1));

// Deque
const d = new Deque<number>();
d.pushBack(1);
d.pushFront(0);
console.log("Deque popFront, popBack:", d.popFront(), d.popBack());

// CircularBuffer
const buf = new CircularBuffer<number>(3);
buf.push(1);
buf.push(2);
buf.push(3);
buf.push(4);
console.log("CircularBuffer:", buf.toArray());

// LRUCache
const lru = new LRUCache<string, number>(2);
lru.set("a", 1);
lru.set("b", 2);
lru.get("a");
lru.set("c", 3);
console.log("LRUCache get('a'):", lru.get("a"));
console.log("LRUCache get('b'):", lru.get("b"));

// TTLCache
const ttl = new TTLCache<string, number>({ ttlMs: 60_000, maxSize: 10 });
ttl.set("x", 42);
console.log("TTLCache get('x'):", ttl.get("x"));

// MultiMap
const mm = new MultiMap<string, number>();
mm.add("tags", 1);
mm.add("tags", 2);
console.log("MultiMap get('tags'):", mm.get("tags"));

// BiMap
const bimap = new BiMap<string, number>();
bimap.set("id", 100);
console.log("BiMap getByKey, getByValue:", bimap.getByKey("id"), bimap.getByValue(100));

// OrderedMap
const om = new OrderedMap<string, number>();
om.set("a", 1);
om.set("b", 2);
console.log("OrderedMap getAt(0), keyAt(1):", om.getAt(0), om.keyAt(1));

// TypedSet with custom equality
const ts = new TypedSet<{ id: number }>({
  equals: (a: { id: number }, b: { id: number }) => a.id === b.id,
  validate: (x: { id: number }) => x.id > 0,
});
ts.add({ id: 1 });
ts.add({ id: 1 });
console.log("TypedSet size:", ts.size);
