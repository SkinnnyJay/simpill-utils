/**
 * @simpill/time.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  addDays,
  debounce,
  diff,
  getUnixTimeStamp,
  startOfDay,
  throttle,
} from "@simpill/time.utils";

const now = new Date();
console.log("getUnixTimeStamp(now):", getUnixTimeStamp(now));

const nextWeek = addDays(now, 7);
console.log("addDays(now, 7):", nextWeek.toISOString().slice(0, 10));

const daysDiff = diff(now, nextWeek);
console.log("diff(now, nextWeek) days:", Math.round(daysDiff / (24 * 60 * 60 * 1000)));

const start = startOfDay(now);
console.log("startOfDay(now):", start.toISOString());

// debounce / throttle
const save = debounce((s: string) => console.log("Saved:", s), 50);
save("x");
const onScroll = throttle((n: number) => console.log("Scroll:", n), 100);
onScroll(1);
