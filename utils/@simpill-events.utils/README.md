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
```

---

## Features

| Feature | Description |
|---------|-------------|
| **PubSub** | subscribe(channel, handler), publish(channel, payload), listenerCount, clearChannel, clear |
| **TypedPubSub** | Type-safe per-channel payloads via createTypedPubSub&lt;ChannelMap&gt; |
| **Observable** | subscribe, getValue/get, setValue/set, update(fn), emitOnSubscribe option |
| **EventEmitter** | Typed events: on, once, off, emit (single payload per event), listenerCount, clear; optional onError. Use payload type `[A, B]` or `{ a, b }` for multiple args. |

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

- **createPubSub**&lt;T&gt;(options?) → PubSub&lt;T&gt; — subscribe(channel, handler), publish(channel, payload), listenerCount, clearChannel, clear
- **createTypedPubSub**&lt;M&gt;(options?) → TypedPubSub&lt;M&gt; — M is ChannelMap (channel name → payload type)
- **createObservable**&lt;T&gt;(initial, options?) → Observable&lt;T&gt; — getValue/get, setValue/set, update, subscribe(listener, { emitOnSubscribe? })
- **createEventEmitter**&lt;M&gt;(options?) → EventEmitter&lt;M&gt; — M is EventMap (event key → single payload); on, once, off, emit, listenerCount, clear
- **EventEmitterOptions** — onError?(event, err); **PubSubOptions** — onError?(channel, err); **ObservableOptions** — onError?(err). Default is a no-op (no console). Provide **onError** to log or forward handler errors.
- **SubscribeOptions** — **emitOnSubscribe**?: boolean — if true, the listener is invoked immediately with the current value when you call subscribe (Observable only).
- **Unsubscribe**, **Listener**, **TypedEventEmitter**, **ChannelMap**

### Single payload and “multi-arg”

**EventEmitter** and **PubSub** use a **single payload** per event/channel. For multiple arguments, use one payload that is an object or tuple, e.g. `type Events = { data: [string, number] }; emit("data", ["a", 1])`.

### Wildcards

There is **no wildcard** subscription (e.g. `subscribe("*", ...)`). Subscribe to explicit channel/event names; use a small facade if you need to fan out to multiple channels.

### Minimal Observable

This **Observable** is minimal: get/set value and subscribe(listener). No operators, no completion, no RxJS-style streams. Use **emitOnSubscribe** so new subscribers get the current value immediately.

### Async and backpressure

Handlers are invoked **synchronously** during emit/publish/setValue. If a handler is async or does heavy work, run it in a fire-and-forget or queue it yourself; this package does not provide backpressure or async dispatch.

### Max listeners

There is **no** setMaxListeners or “possible memory leak” warning. Track **listenerCount** yourself if you need to guard against runaway subscriptions.

### Promise-based “once”

**once**(event, handler) is callback-based. For a promise that resolves on first emit:  
`const p = new Promise<T>(res => emitter.once("event", res));`

### What we don't provide

- **Wildcard subscriptions** — No `subscribe("*", ...)`; subscribe to explicit channel/event names.
- **RxJS-style operators** — Observable is get/set/subscribe only; no map, filter, or streams.
- **Backpressure / async dispatch** — Handlers run synchronously; queue or fire-and-forget async work yourself.
- **setMaxListeners / leak warning** — No built-in cap or warning; use **listenerCount** to guard if needed.

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
