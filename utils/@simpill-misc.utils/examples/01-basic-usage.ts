/**
 * @simpill/misc.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { createSingleton, debounce, memoize, once, throttle } from "@simpill/misc.utils";

// createSingleton: keyed singleton
const getDb = createSingleton(() => ({ connected: true }), "db");
const db1 = getDb();
const db2 = getDb();
console.log("createSingleton:", db1 === db2);

// once: run only first time
const load = once(() => {
  console.log("load() called");
  return 42;
});
console.log(load(), load()); // 42, 42; "load() called" once

// memoize: cache by first argument
const double = memoize((x: number) => x * 2);
console.log("memoize:", double(5), double(5)); // 10, 10

// debounce / throttle (same API as function.utils)
const save = debounce((s: string) => console.log("Saved:", s), 50);
save("a");
save("b");
const onScroll = throttle((n: number) => console.log("Scroll:", n), 100);
onScroll(1);
onScroll(2);
