/**
 * @simpill/function.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { debounce, once, pipe, throttle } from "@simpill/function.utils";

// Debounce: invoke after wait ms of no calls
const save = debounce((msg: string) => console.log("Saved:", msg), 100);
save("a");
save("b");
save("c");
setTimeout(() => {}, 150); // after 100ms only "Saved: c" runs

// Throttle: at most one call per wait ms
const onScroll = throttle((y: number) => console.log("Scroll:", y), 200);
onScroll(1);
onScroll(2);
onScroll(3); // only first (or last depending on impl) within 200ms

// Once: run only the first time
const load = once(() => {
  console.log("Loading...");
  return 42;
});
console.log(load()); // 42, logs "Loading..."
console.log(load()); // 42, no log

// Pipe: left-to-right composition
const trim = (s: string) => s.trim();
const toLower = (s: string) => s.toLowerCase();
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const transform = pipe(trim, toLower, capitalize);
console.log(transform("  HELLO  ")); // "Hello"
