/**
 * @simpill/events.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  createEventEmitter,
  createObservable,
  createPubSub,
  createTypedPubSub,
} from "@simpill/events.utils";

// PubSub: channel-based (subscribe and publish with channel name)
const pubsub = createPubSub<string>();
const unsub = pubsub.subscribe("alerts", (msg) => console.log("PubSub:", msg));
pubsub.publish("alerts", "hello");
unsub();
pubsub.publish("alerts", "world"); // not logged

// Observable: getValue/setValue (or get/set), update(fn)
const obs = createObservable(0);
obs.subscribe((n) => console.log("Observable:", n));
obs.setValue(1);
obs.set(2);
console.log("Observable get:", obs.get());

// EventEmitter: typed events (single payload per event; use undefined for no payload)
type MyEvents = { message: string; tick: undefined };
const emitter = createEventEmitter<MyEvents>();
emitter.on("message", (msg) => console.log("Event message:", msg));
emitter.on("tick", () => console.log("Event tick"));
emitter.emit("message", "hi");
emitter.emit("tick", undefined);

// TypedPubSub: different payload type per channel
type Channels = { news: string; count: number };
const typed = createTypedPubSub<Channels>();
typed.subscribe("news", (text) => console.log("News:", text));
typed.subscribe("count", (n) => console.log("Count:", n));
typed.publish("news", "Hello");
typed.publish("count", 42);
