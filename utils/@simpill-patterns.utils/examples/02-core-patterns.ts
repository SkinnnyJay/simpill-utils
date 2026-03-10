/**
 * @simpill/patterns.utils - Core pattern examples
 *
 * Use cases: adapt external types to yours (Adapter), wrap functions with logging/timing (Decorator),
 * one-to-many events (Observer), typed event bus (Mediator), UI/workflow states (StateMachine).
 *
 * Run: npx ts-node examples/02-core-patterns.ts
 */

import {
  adapt,
  createAdapter,
  createMediator,
  createObservable,
  createStateMachine,
  decorate,
} from "@simpill/patterns.utils";

// --- Adapter: typed conversion (e.g. external API shape → your domain type) ---
const numberAdapter = createAdapter((input: { value: string }) => Number(input.value));
console.log("adapt:", adapt({ value: "42" }, numberAdapter)); // 42

// --- Decorator: wrap a function with cross-cutting behavior (log, time, validate) ---
const add = (a: number, b: number) => a + b;
const withLog = (fn: typeof add) => (a: number, b: number) => {
  const result = fn(a, b);
  console.log("add result:", result);
  return result;
};
const addLogged = decorate(add, withLog);
addLogged(2, 3);

// --- Observer: one source, many subscribers (component events, log streams) ---
const observable = createObservable<string>();
const unsubscribe = observable.subscribe((message) => {
  console.log("observer:", message);
});
observable.next("hello");
unsubscribe();
observable.next("bye");

// --- Mediator: typed event bus (app-level events: userLoggedIn, orderPlaced) ---
type Events = { ping: string };
const mediator = createMediator<Events>();
mediator.on("ping", (message) => console.log("mediator:", message));
mediator.emit("ping", "hello");

// --- State machine: UI/workflow states (idle → loading → done), can(event) for button state ---
type State = "idle" | "loading" | "done";
type Event = "FETCH" | "RESOLVE";
const machine = createStateMachine<State, Event>("idle", {
  idle: { FETCH: "loading" },
  loading: { RESOLVE: "done" },
});
console.log("state:", machine.getState());
machine.transition("FETCH");
console.log("state:", machine.getState());
