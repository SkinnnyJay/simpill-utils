/**
 * @simpill/cache.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { LRUMap, memoize } from "@simpill/cache.utils";

// LRU map with max size
const lru = new LRUMap<string, number>(3);
lru.set("a", 1);
lru.set("b", 2);
lru.set("c", 3);
lru.set("d", 4); // evicts "a"
console.log("LRU get a:", lru.get("a")); // undefined
console.log("LRU get b:", lru.get("b")); // 2
console.log("LRU size:", lru.size); // 3

// Memoize a function
const expensive = (x: number) => {
  console.log("  computing", x);
  return x * 2;
};
const memoized = memoize(expensive);
console.log("Memoize:", memoized(5)); // 10, logs "computing 5"
console.log("Memoize:", memoized(5)); // 10, no log
console.log("Memoize:", memoized(7)); // 14, logs "computing 7"
