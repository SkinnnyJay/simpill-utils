## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fevents.utils.svg)](https://www.npmjs.com/package/@simpill/events.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-events.utils)
</p>

**npm**
```bash
npm install @simpill/events.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-events.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-events.utils` or `npm link` from that directory.

---

## Usage

```ts
import {
  createPubSub,
  createObservable,
  createEventEmitter,
} from "@simpill/events.utils";

// PubSub: channel-based messaging (subscribe by channel name)
const pubsub = createPubSub<string>();
const unsub = pubsub.subscribe("alerts", (msg) => console.log(msg));
pubsub.publish("alerts", "hello");

// Observable: reactive value with getValue/setValue (or get/set)
const obs = createObservable(0);
obs.subscribe((n) => console.log(n));
obs.setValue(1);
obs.get(); // 1

// EventEmitter: typed events (single payload per event; use undefined for no payload)
type Events = { message: string; tick: undefined };
const emitter = createEventEmitter<Events>();
emitter.on("message", (msg) => console.log(msg));
emitter.emit("message", "hi");
emitter.emit("tick", undefined);

// Async dispatch, wildcard listeners, and promise-based waiting
emitter.onAny((event, payload) => console.log("saw", event, payload));
await emitter.emitAsync("message", "processed in order", { mode: "serial" });
const next = await emitter.waitFor("message", { timeout: 5000 });
```

---

## Features

| Feature | Description |
|---------|-------------|
| **PubSub** | subscribe(channel, handler), subscribeOnce, publish, publishAsync, waitFor, listenerCount, clearChannel, clear |
| **TypedPubSub** | Type-safe per-channel payloads via createTypedPubSub&lt;ChannelMap&gt; — same surface as PubSub |
| **Observable** | subscribe, getValue/get, setValue/set, update(fn), listenerCount, emitOnSubscribe option |
| **EventEmitter** | Typed events: on, once, off, emit (returns boolean), emitAsync (serial/parallel), onAny/offAny, waitFor (AbortSignal + timeout), listenerCount, clear, setMaxListeners/getMaxListeners; optional onError/onLeak. Use payload type `[A, B]` or `{ a, b }` for multiple args. |
| **Re-entrancy safe** | Listeners added/removed during a dispatch never affect that dispatch cycle — dispatch runs against a snapshot, and removed listeners are skipped mid-cycle. |

---

## Import Paths

```ts
import { ... } from "@simpill/events.utils";         // Everything
import { ... } from "@simpill/events.utils/client";  // Client
import { ... } from "@simpill/events.utils/server";  // Server
import { ... } from "@simpill/events.utils/shared";  // Shared only
```

---

## API Reference

- **createPubSub**&lt;T&gt;(options?) → PubSub&lt;T&gt; — subscribe(channel, handler), subscribeOnce(channel, handler), publish(channel, payload) → boolean, publishAsync(channel, payload, { mode? }), waitFor(channel, { signal?, timeout? }), listenerCount, clearChannel, clear
- **createTypedPubSub**&lt;M&gt;(options?) → TypedPubSub&lt;M&gt; — M is ChannelMap (channel name → payload type); same surface as PubSub
- **createObservable**&lt;T&gt;(initial, options?) → Observable&lt;T&gt; — getValue/get, setValue/set, update, subscribe(listener, { emitOnSubscribe? }), listenerCount
- **createEventEmitter**&lt;M&gt;(options?) → EventEmitter&lt;M&gt; — M is EventMap (event key → single payload); on, once, off, emit → boolean, emitAsync, onAny, offAny, waitFor, listenerCount, clear, setMaxListeners, getMaxListeners
- **EventEmitterOptions** — onError?(event, err), maxListeners?, onLeak?(event, count); **PubSubOptions** — onError?(channel, err), maxListeners?, onLeak?(channel, count); **ObservableOptions** — onError?(err). Default onError is a no-op (no console). Provide **onError** to log or forward handler errors.
- **SubscribeOptions** — **emitOnSubscribe**?: boolean — if true, the listener is invoked immediately with the current value when you call subscribe (Observable only).
- **EventWaitTimeoutError**, **ChannelWaitTimeoutError** — thrown (rejected) by waitFor when the timeout elapses.
- **Unsubscribe**, **Listener**, **TypedEventEmitter**, **ChannelMap**

### Single payload and “multi-arg”

**EventEmitter** and **PubSub** use a **single payload** per event/channel. For multiple arguments, use one payload that is an object or tuple, e.g. `type Events = { data: [string, number] }; emit("data", ["a", 1])`.

### Re-entrancy semantics

Dispatch (emit / publish / setValue) runs against a **snapshot** of the listeners registered at dispatch start:

- A listener **added during** a dispatch will not receive that same dispatch (matches Node's EventEmitter).
- A listener **removed during** a dispatch is skipped for the remainder of that dispatch cycle.
- `emit`/`publish` return **true** if any listener received the event, **false** otherwise (matches Node).

### Wildcard listeners

`onAny(handler)` receives `(event, payload)` for **every** emit, after event-specific listeners. Remove with `offAny(handler)` or the returned unsubscribe. (PubSub remains explicit-channel; use an emitter with onAny if you need full fan-in.)

### Async dispatch

`emitAsync(event, payload, { mode })` / `publishAsync(channel, payload, { mode })`:

- `mode: "parallel"` (default) — all handlers start immediately; resolves when all settle (Promise.all semantics).
- `mode: "serial"` — each async handler is awaited in registration order before the next runs.
- Handler errors are aggregated: a single failure rethrows that error; multiple failures reject with **AggregateError**. `onError` is still invoked per failure.

### Promise-based waiting

`waitFor(event, { signal?, timeout? })` resolves with the first payload for that event. Supports **AbortSignal** and a **timeout** (rejects with `EventWaitTimeoutError` / `ChannelWaitTimeoutError`). The internal listener is always cleaned up — no leaks on abort, timeout, or resolution.

### Leak guard (opt-in)

Pass `maxListeners` (and optionally `onLeak`) in options, or call `setMaxListeners(n)`. When a single event/channel exceeds the cap, `onLeak(event, count)` fires — no console noise, no hard limit, disabled by default (`0`). `getMaxListeners()` reads the current cap.

### Minimal Observable

This **Observable** is minimal: get/set value, subscribe(listener), and listenerCount. No operators, no completion, no RxJS-style streams. Use **emitOnSubscribe** so new subscribers get the current value immediately.

### What we don't provide

- **RxJS-style operators** — Observable is get/set/subscribe only; no map, filter, or streams.
- **Backpressure** — emitAsync awaits handlers but there is no queueing or rate control; bring your own queue for sustained load.
- **Node EventEmitter API compatibility** — this is a typed, payload-first API, not a drop-in `require("events")` replacement.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | PubSub subscribe/publish, Observable get/set/subscribe, EventEmitter on/emit (single payload) |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
