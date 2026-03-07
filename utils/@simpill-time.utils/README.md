## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2ftime.utils.svg)](https://www.npmjs.com/package/@simpill/time.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-time.utils)
</p>

**npm**
```bash
npm install @simpill/time.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-time.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-time.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  getUnixTimeStamp,
  addDays,
  diff,
  startOfDay,
  endOfDay,
  debounce,
  throttle,
} from "@simpill/time.utils";

const ts = getUnixTimeStamp();
const next = addDays(new Date(), 7);
const daysDiff = diff(now, next);
const start = startOfDay(now);
const save = debounce(doSave, 100);
const onScroll = throttle(handler, 200);
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Date/time** | getUnixTimeStamp, getUnixTimeStampMs, addDays/Hours/Minutes/etc., diff, delta, deltaStructured, add(duration), startOfDay, endOfDay |
| **debounce** / **throttle** | Re-exported from `@simpill/function.utils` (canonical). Use function.utils for rate-limiting only. |
| **IntervalManager** | createManagedInterval, createManagedTimeout, createTimerFactory (server); canonical implementation here. |

---

## Import Paths

```ts
import { ... } from "@simpill/time.utils";         // Everything
import { ... } from "@simpill/time.utils/client";  // Client (debounce, throttle)
import { ... } from "@simpill/time.utils/server";   // Server (+ interval manager)
import { ... } from "@simpill/time.utils/shared";  // Shared (date-time, debounce-throttle)
```

---

## API Reference

- **getUnixTimeStamp**, **getUnixTimeStampMs**
- **addDays**, **addWeeks**, **addMonths**, **addYears**, **addHours**, **addMinutes**, **addSeconds**, **addMs**
- **add**(date, duration) — Duration type
- **diff**, **delta**, **deltaStructured**
- **startOfDay**, **endOfDay**
- **debounce**, **throttle** — CancellableFunction
- **IntervalManager**, **createManagedInterval**, **createManagedTimeout**, **createTimerFactory** (server)
- **DateInput**, **Duration**, **DeltaResult**

### addMonths / addYears rollover

`addMonths` and `addYears` use native `Date#setMonth` / `setFullYear`. If the resulting day would be invalid (e.g. Jan 31 + 1 month), the engine rolls to the next valid day (e.g. Mar 2 or 3). For calendar-accurate “same day next month” behavior, consider a library like date-fns (`addMonths` there clamps to the last day of the month when needed).

### IntervalManager (server)

Use **createManagedInterval**(name, callback, intervalMs) to run a callback on an interval; **createManagedTimeout**(name, callback, delayMs) for a one-shot. Both return a clear function. The **intervalManager** singleton registers shutdown cleanup (SIGTERM) to clear intervals. Use **createTimerFactory()** to get a scoped factory that creates named timers. Useful for long-running servers to avoid leaking intervals.

### Parse and format helpers

**toDateSafe**(value, fallback?) parses unknown input to a Date: accepts Date, number (ms), or ISO-like string; returns fallback (or new Date()) for invalid input. **formatISO**(date) returns **date.toISOString()**. There are **no** format-string or locale-aware formatters (e.g. “MM/DD/YYYY” or “Jan 1, 2025”); use **Intl.DateTimeFormat** or a library like date-fns for that.

### Timezone and locale

All date arithmetic and **startOfDay** / **endOfDay** use the **local** timezone of the runtime (JavaScript Date behavior). There is **no** timezone or locale API (e.g. IANA names, UTC offsets, or localized strings). For timezone-aware work use **Intl**, **Temporal** (when available), or a library like date-fns-tz.

### Comparison helpers

**diff**(from, to) and **delta**(from, to) return milliseconds (to − from). **deltaStructured**(from, to) returns **{ ms, seconds, minutes, hours, days }**. **isPast**(date) and **isFuture**(date) compare to **Date.now()**. **clampDate**(date, min, max) returns a new Date clamped to the range. There is **no** “months between” or “years between”; compute from **diff** or use a calendar library.

### Calendar helpers

**startOfDay** and **endOfDay** (local 00:00:00.000 and 23:59:59.999) are provided. There are **no** **startOfWeek**, **startOfMonth**, **startOfYear**, or **endOfMonth** helpers; build from **startOfDay** and **addDays** / **addMonths** or use date-fns/dayjs.

### Humanized duration

There are **no** “2 hours ago” or “in 3 days” string formatters. Use **deltaStructured** to get numeric components and format yourself, or use a library (e.g. date-fns **formatDistanceToNow**).

### Months / years delta

**addMonths** and **addYears** add a number of calendar months/years. **diff** / **deltaStructured** give differences in ms or days/hours/minutes/seconds; they do **not** return “number of calendar months between two dates.” For that, compute from **diff** or use a calendar-aware library.

### What we don't provide

- **Format strings / locale** — No “MM/DD/YYYY” or “Jan 1, 2025”; use **formatISO** or **Intl.DateTimeFormat** / date-fns.
- **Timezone or locale API** — All arithmetic is local; for IANA timezones or UTC offsets use **Intl**, **Temporal**, or date-fns-tz.
- **startOfWeek / startOfMonth / startOfYear / endOfMonth** — Only **startOfDay** and **endOfDay**; build from them or use a calendar library.
- **Humanized duration** — No “2 hours ago”; use **deltaStructured** and format yourself or date-fns **formatDistanceToNow**.
- **Calendar months/years between** — **diff** returns ms; for “number of months between two dates” use a calendar library.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Unix timestamps, add days/hours, diff in ms | Use **getUnixTimeStamp**, **addDays** / **addHours** / **add**, **diff** / **deltaStructured**. |
| Start/end of day (local) | Use **startOfDay**, **endOfDay**. |
| Parse/format ISO only | Use **toDateSafe**, **formatISO**. |
| Format strings or locale | Use **Intl.DateTimeFormat** or date-fns. |
| Timezone / “in Paris” | Use **Temporal** or a timezone library. |
| “X ago” / humanized duration | Use **deltaStructured** + your own strings or date-fns **formatDistanceToNow**. |
| Managed intervals (server) | Use **createManagedInterval** / **createManagedTimeout** from **server**. |

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | getUnixTimeStamp, addDays, diff, startOfDay, debounce, throttle, add(duration), deltaStructured |

**debounce / throttle options:** These are re-exported from `@simpill/function.utils`. For leading/trailing/maxWait and cancel/flush, see that package’s docs.

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
