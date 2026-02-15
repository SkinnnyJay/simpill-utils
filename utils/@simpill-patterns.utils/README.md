<p align="center">
  <img src="./assets/logo-banner.svg" alt="@simpill/patterns.utils" width="100%" />
</p>

<p align="center">
  <strong>Composable design patterns: Result/Either, strategySelector, pipeAsync</strong>
</p>

<p align="center">
  Result/Either-style error handling, async pipelines, and strategy dispatch—type-safe and lightweight.
</p>

**Features:** Type-safe · Node & Edge · Tree-shakeable

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#high-value-vs-type-helpers">High-value vs type helpers</a> •
  <a href="#features">Features</a> •
  <a href="#documentation-and-use-cases">Documentation & use cases</a> •
  <a href="#import-paths">Import Paths</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

**When to use:** You want Result/Either-style error handling. This package uses many small pattern files (adapter, facade, proxy, result, strategy-selector, etc.). If the count becomes hard to maintain, we may consolidate into fewer, more cohesive modules. (`ok`/`err`, `unwrapOr`, `fromThrowable`), async pipelines (`pipeAsync`), key-based strategy dispatch (`strategySelector`), or composable patterns (Observer, State, Builder, etc.) without pulling in a large library.

---

## Installation

```bash
npm install @simpill/patterns.utils
```

---

## Quick Start

```typescript
import {
  ok,
  err,
  isOk,
  isErr,
  unwrapOr,
  fromThrowable,
  pipeAsync,
  strategySelector,
} from "@simpill/patterns.utils";

const r = ok(42);
if (isOk(r)) console.log(r.value);
const e = err(new Error("fail"));
const value = unwrapOr(e, 0);

const pipeline = pipeAsync(addOne, double);
const compute = strategySelector({ add: ([a, b]) => a + b, mul: ([a, b]) => a * b });
```

---

## High-value vs type helpers

| Kind | Exports | What you get |
|------|---------|----------------|
| **High-value** (real behavior) | Result, pipeAsync, strategySelector, chainOfResponsibility, createStateMachine, createObservable, createBuilder, createFlyweightFactory, createMediator, createComposite, createMethodProxy, runCommandWithUndo, raceOk, toResult, fromPromise | Implementations that save boilerplate and enforce structure. |
| **Type / pattern helpers** | createAdapter, adapt, createFacade, createFacadeFrom, createFactory, createCommand | Typed names for patterns (e.g. “this function is an Adapter”). No extra runtime behavior—use when you want consistent vocabulary and types. |

Use **high-value** APIs when you need the behavior. Use **type helpers** when you want to label a pattern in types and docs (e.g. dependency injection, testing mocks, or team conventions).

---

## Features

| Feature | Description |
|---------|-------------|
| **Result** | ok, err, isOk, isErr, unwrapOr, fromThrowable, toResult, fromPromise |
| **pipeAsync** | Async function composition |
| **strategySelector** | Dispatch by key with optional defaultKey |
| **chainOfResponsibility** | handled, unhandled, ChainHandler |
| **Command** | createCommand, runCommand, runCommandWithUndo |
| **Adapter** | createAdapter, adapt |
| **Builder** | createBuilder |
| **Decorator** | decorate |
| **Factory** | createFactory |
| **Facade** | createFacade, createFacadeFrom |
| **Flyweight** | createFlyweightFactory |
| **Mediator** | createMediator |
| **Observer** | createObservable |
| **Composite** | createComposite, traverseComposite, mapComposite, reduceComposite |
| **Proxy** | createMethodProxy |
| **State** | createStateMachine |
| **raceOk** | First Ok wins from many Result promises |

### When to use which pattern

| Need | Use |
|------|-----|
| Return success/failure without throwing | **Result** (ok/err, unwrapOr, fromThrowable, toResult, fromPromise) |
| Async pipeline (f1 then f2 then f3) | **pipeAsync** |
| Dispatch by string key with fallback | **strategySelector** / **strategySelectorOptional** |
| Handlers in sequence until one handles | **chainOfResponsibility** |
| Typed “conversion function” (e.g. for DI) | **Adapter** (createAdapter, adapt) |
| Stepwise construction with validation | **Builder** |
| Single shared instance per key | **Flyweight** (createFlyweightFactory) |
| Notify many listeners | **Observer** (createObservable) |
| Typed event bus (event → payload) | **Mediator** (createMediator) |
| State-dependent behavior | **State** (createStateMachine) |
| Tree of nodes (e.g. UI, AST) | **Composite** |
| Intercept method calls (logging, metrics) | **Proxy** (createMethodProxy) |
| Execute + optional undo | **Command** (runCommandWithUndo) |
| First success among many async Results | **raceOk** |

This package is minimal compared to **fp-ts** (no full type-class hierarchy) or **neverthrow** (no ResultAsync); use it when you want Result/strategy/pipe and small patterns without extra dependencies.

### What we don't provide

- **ResultAsync / neverthrow-style** — No lazy Result-from-Promise wrapper; use **fromPromise** or **toResult** with async functions and **pipeAsync** for pipelines.
- **fp-ts Option / Task / Either** — No Option type or Task; Result covers success/failure. For full type-class style use **fp-ts**.
- **Full type-class hierarchy** — No Functor, Monad, or Traversable; just Result, pipeAsync, and pattern helpers.

---

## Documentation and use cases

### Result (`ok`, `err`, `isOk`, `isErr`, `unwrapOr`, `fromThrowable`, `toResult`, `fromPromise`)

**What it is:** A discriminated union `{ ok: true, value: T } | { ok: false, error: E }` so you can return success or failure without throwing.

**Use cases:**

- **API / service layer:** Return `Result<User, AppError>` instead of throwing; callers handle both branches.
- **Parsing / validation:** `fromThrowable(() => JSON.parse(str))` → `Result<unknown, unknown>`; then map error or use `unwrapOr`.
- **Async I/O:** `toResult(fetch(url))` or `fromPromise(() => fetch(url))` → `Promise<Result<T, AppError>>` with normalized errors.
- **Default values:** `unwrapOr(result, defaultValue)` when you don’t care about the error.

**Examples:**

```typescript
// Sync: wrap throwing code
const parsed = fromThrowable(() => JSON.parse(input));
if (isErr(parsed)) return fallback;
console.log(parsed.value);

// Async: turn a promise into Result<T, AppError>
const res = await fromPromise(() => fetchUser(id));
if (isOk(res)) setUser(res.value);
else showError(res.error);

// Fallback
const value = unwrapOr(parseConfig(), defaultConfig);
```

---

### pipeAsync

**What it is:** Composes async functions so the output of one is the input of the next. Short-circuits on first rejection.

**Use cases:**

- **Request pipelines:** validate → enrich → persist (each step async).
- **ETL / data:** fetch → parse → transform → write.
- **Middleware-like flows:** auth → load → render.

**Examples:**

```typescript
const loadUser = pipeAsync(
  (id: string) => api.getUser(id),
  (user) => enrichWithPermissions(user),
  (user) => cache.set(user.id, user)
);
await loadUser("u1");
```

---

### strategySelector / strategySelectorOptional

**What it is:** Dispatch by a string key to a function; optional `defaultKey` or return `undefined` for unknown keys.

**Use cases:**

- **API version/action routing:** `strategySelector({ v1: handleV1, v2: handleV2 }, { defaultKey: "v2" })`.
- **Calculators / ops:** `strategySelector({ add, mul, sub })` with `(op, [a, b])`.
- **File type handlers:** key = extension, strategy = parser.
- **Feature flags / A/B:** key = variant, strategy = handler (optional fallback with defaultKey).

**Examples:**

```typescript
type Format = "json" | "xml" | "csv";
const serialize = strategySelector<Format, Data, string>({
  json: (d) => JSON.stringify(d),
  xml: (d) => toXML(d),
  csv: (d) => toCSV(d),
}, { defaultKey: "json" });
serialize("json", data);
serialize("unknown" as Format, data); // uses "json"
```

---

### chainOfResponsibility (`handled`, `unhandled`, ChainHandler)

**What it is:** Run a list of handlers in order; the first that returns `handled(value)` wins; otherwise optional fallback or throw.

**Use cases:**

- **Request handling:** try auth A, then auth B, then anonymous.
- **Validation:** first handler that understands the input (e.g. by content-type) validates it.
- **Pricing / rules:** first rule that applies returns a price.
- **Logging / pipelines:** first handler that can process the event does so.

**Examples:**

```typescript
const handle = chainOfResponsibility<Request, Response>([
  (req) => (req.headers.get("x-api-key") ? handled(handleWithKey(req)) : unhandled()),
  (req) => (req.headers.get("cookie") ? handled(handleWithSession(req)) : unhandled()),
], { fallback: (req) => respond401(req) });
```

---

### createStateMachine

**What it is:** A finite state machine: states, events, transition map (literal next state or function), optional context and `onTransition` hook.

**Use cases:**

- **UI flows:** idle → loading → success | error; buttons enable/disable by `can(event)`.
- **Workflow / saga:** draft → submitted → approved | rejected.
- **Connections:** disconnected → connecting → connected → reconnecting.
- **Game / app lifecycle:** boot → ready → running → paused.

**Examples:**

```typescript
type State = "idle" | "loading" | "done" | "error";
type Event = "FETCH" | "RESOLVE" | "REJECT" | "RETRY";
const fsm = createStateMachine<State, Event, { userId: string }>(
  "idle",
  {
    idle:    { FETCH: "loading" },
    loading: { RESOLVE: "done", REJECT: "error" },
    done:    {},
    error:   { RETRY: "loading" },
  },
  { onTransition: (next, prev, event) => analytics.track(prev, event, next) }
);
fsm.transition("FETCH", { userId: "u1" });
console.log(fsm.getState()); // "loading"
console.log(fsm.can("RESOLVE")); // true
```

---

### createObservable (Observer)

**What it is:** Simple pub/sub: `subscribe(observer)`, `next(event)`, `clear()`, `getObserverCount()`.

**Use cases:**

- **Component events:** one source, many UI subscribers.
- **Log streams / metrics:** one emitter, many sinks.
- **Decoupled modules:** producer calls `next`; consumers subscribe.
- **Testing:** subscribe, trigger, assert on events.

**Examples:**

```typescript
const events = createObservable<{ type: string; payload: unknown }>();
const unsub = events.subscribe((e) => console.log(e));
events.next({ type: "click", payload: { id: "btn1" } });
unsub();
```

---

### createBuilder

**What it is:** Chainable `set(key, value)` and `merge(partial)` with immutable-style updates; `build()` returns a copy of the current object.

**Use cases:**

- **Config objects:** optional steps (set timeout, set retries, set headers) then build.
- **Test fixtures:** set only the fields you need, merge defaults.
- **DTOs / requests:** stepwise construction with a final validated build (e.g. call a validator in tests before build).

**Examples:**

```typescript
const config = createBuilder({ host: "localhost", port: 3000 })
  .set("port", 4000)
  .merge({ timeout: 5000 })
  .build();
```

---

### createFlyweightFactory

**What it is:** Cache instances by key; same key returns the same instance. `get(key)`, `clear()`, `size()`.

**Use cases:**

- **Shared instances per ID:** one “connection” or “loader” per resource ID.
- **Parsers / formatters per locale or options:** key = locale, value = formatter instance.
- **Expensive objects:** reuse by a canonical key (e.g. normalized config string).

**Examples:**

```typescript
const formatters = createFlyweightFactory(
  (locale: string) => locale,
  (locale) => new Intl.NumberFormat(locale)
);
formatters.get("en-US") === formatters.get("en-US"); // true
```

---

### createMediator

**What it is:** Typed event hub: `on(event, handler)`, `off`, `emit(event, payload)`, `clear`, `listenerCount(event)`.

**Use cases:**

- **App-level events:** `emit("userLoggedIn", user)`; nav, analytics, and cache all subscribe.
- **Decoupled features:** component emits; other modules react without direct imports.
- **Testing:** subscribe to events and assert payloads.

**Examples:**

```typescript
type AppEvents = { userLoggedIn: User; orderPlaced: Order };
const bus = createMediator<AppEvents>();
bus.on("userLoggedIn", (user) => analytics.identify(user.id));
bus.emit("userLoggedIn", user);
```

---

### createComposite, traverseComposite, mapComposite, reduceComposite

**What it is:** Tree of nodes with `value` and `children`; helpers to traverse, map, and reduce.

**Use cases:**

- **UI trees:** sections with nested sections or components.
- **AST / config:** hierarchical structure; map or aggregate over nodes.
- **Categories / taxonomies:** parent/child; count or collect by predicate.

**Examples:**

```typescript
const root = createComposite("root", [
  createComposite("a", [createComposite("a1")]),
  createComposite("b"),
]);
traverseComposite(root, (n) => console.log(n.value));
const sum = reduceComposite(root, (acc, n) => acc + (typeof n.value === "number" ? n.value : 0), 0);
```

---

### createMethodProxy (Proxy)

**What it is:** Wraps an object’s methods with `before`, `after`, and `error` hooks (logging, metrics, error handling).

**Use cases:**

- **Logging:** log method name and args before, result after.
- **Metrics:** time methods or count calls.
- **Error handling:** normalize errors or retry in `error` hook.

**Examples:**

```typescript
const api = createMethodProxy(realApi, {
  before: (method, args) => console.log(method, args),
  after: (method, _args, result) => console.log(method, "->", result),
  error: (method, args, err) => logger.error({ method, args, err }),
});
```

---

### Command (createCommand, runCommand, runCommandWithUndo)

**What it is:** Typed “command” object with `execute` and optional `undo`. `runCommandWithUndo` runs and returns `{ result, undo }` so you can call `undo()` later.

**Use cases:**

- **Undo/redo:** store `undo` from `runCommandWithUndo` in a stack.
- **Transactional steps:** execute several commands; on failure, run undos in reverse.
- **Audit:** record command + input + result for replay or audit log.

**Examples:**

```typescript
const setVolume = createCommand({
  execute: (v: number) => { const prev = volume; volume = v; return prev; },
  undo: (_input, prev) => { volume = prev; },
});
const { result: previousVolume, undo } = runCommandWithUndo(setVolume, 80);
// later
undo();
```

---

### raceOk

**What it is:** Takes an array of promises that resolve to `Result<T, E>`; resolves with the first `Ok`, or with `Err(mapped)` if all fail.

**Use cases:**

- **Redundancy:** try multiple endpoints or caches; use first success.
- **Fallback sources:** primary + backup; first Ok wins.
- **Timeouts / retries:** combine with `fromPromise` and short timeouts.

**Examples:**

```typescript
const res = await raceOk([
  fetchUserFromPrimary(id),
  fetchUserFromReplica(id),
]);
if (isOk(res)) setUser(res.value);
else showError(res.error);
```

---

### Adapter (createAdapter, adapt) — type helper

**What it is:** A typed name for “function from A to B”. `createAdapter(fn)` returns `fn`; `adapt(source, adapter)` returns `adapter(source)`.

**Use cases:** Document that a function “adapts” one interface to another; use in DI or tests (e.g. “this service takes an Adapter<ExternalUser, OurUser>”).

---

### Facade (createFacade, createFacadeFrom) — type helper

**What it is:** A typed name for “simplified surface”. `createFacade(obj)` returns `obj`; `createFacadeFrom(deps, factory)` returns `factory(deps)`.

**Use cases:** Document that an object is a “facade” over a complex subsystem; `createFacadeFrom` is useful when building that facade from dependencies (e.g. in composition root).

---

### Factory (createFactory) — type helper

**What it is:** A typed name for “function that creates T”. `createFactory(fn)` returns `fn`.

**Use cases:** Type factories in DI or tests (e.g. `Factory<Logger, [Config]>`).

---

### Decorator (decorate)

**What it is:** Composes one base function with several “decorator” functions (each wraps the previous). Applied left to right.

**Use cases:** Add logging, timing, or validation around a core function without changing its signature.

**Examples:**

```typescript
const withLog = (fn: typeof add) => (...args: Parameters<typeof add>) => {
  const result = fn(...args);
  console.log("result", result);
  return result;
};
const addLogged = decorate(add, withLog);
```

---

## Import Paths

```typescript
import { ... } from "@simpill/patterns.utils";         // Everything
import { ... } from "@simpill/patterns.utils/client";  // Client
import { ... } from "@simpill/patterns.utils/server";  // Server
import { ... } from "@simpill/patterns.utils/shared"; // Shared only
```

---

## API Reference

- **Result**&lt;T, E&gt;, **ok**, **err**, **isOk**, **isErr**, **unwrapOr**, **fromThrowable**, **toResult**, **fromPromise**
- **pipeAsync**(...fns) → composed async function
- **strategySelector**(strategies, options?) → (key, input) => O
- **strategySelectorOptional** — returns undefined for unknown key
- **chainOfResponsibility**, **handled**, **unhandled**, **ChainHandler**, **ChainResult**, **ChainOptions**
- **createCommand**, **runCommand**, **runCommandWithUndo**, **Command**, **CommandExecution**
- **createAdapter**, **adapt**, **Adapter**
- **createBuilder**, **Builder**
- **decorate**, **Decorator**
- **createFacade**, **createFacadeFrom**, **Facade**
- **createFactory**, **Factory**
- **createFlyweightFactory**, **FlyweightFactory**
- **createMediator**, **Mediator**, **MediatorHandler**
- **createObservable**, **Observable**, **Observer**, **Unsubscribe**
- **createComposite**, **CompositeNode**, **addChild**, **removeChild**, **traverseComposite**, **mapComposite**, **reduceComposite**
- **createMethodProxy**, **MethodProxyHooks**
- **createStateMachine**, **StateMachine**, **StateTransitions**, **StateTransition**, **StateMachineOptions**
- **raceOk**, **RaceOkOptions**

### Result combinators

This package does **not** provide **map**, **flatMap**, **mapError**, or **andThen** on Result. Use **isOk** / **isErr** and branch, or **unwrapOr**(r, default). To transform: `isOk(r) ? ok(f(r.value)) : r`; to chain async: use **fromPromise** / **toResult** in sequence and check **isOk** between steps. For a full combinator set use **fp-ts** or **neverthrow**.

### Async Result

**toResult**(promise, mapError?) and **fromPromise**(fn, mapError?) turn a Promise into **Promise&lt;Result&lt;T, AppError&gt;&gt;** (default **mapError** wraps to AppError). Use them for async I/O; combine with **raceOk** for “first success.” For retry that returns Result use **@simpill/resilience.utils** **retryResult**.

### All exports

The **API Reference** above lists every public export. From **shared**: Result (ok, err, isOk, isErr, unwrapOr, fromThrowable, toResult, fromPromise), pipeAsync, strategySelector, strategySelectorOptional, chainOfResponsibility (handled, unhandled), Command, Adapter, Builder, Decorator, Facade, Factory, Flyweight, Mediator, Observable, Proxy, StateMachine, Composite helpers, raceOk. Client/server re-export the same; see package **index** and **shared/index** for the full list.

### Unwrap (value or throw)

There is **no** **unwrap**(r) that returns value or throws. Use **unwrapOr**(r, fallback) for a default, or `if (isOk(r)) return r.value; throw r.error` (or return a typed error response). This avoids hidden throws and keeps handling explicit.

### pipeAsync and cancellation

**pipeAsync** composes async functions with **.then()**; it does **not** accept **AbortSignal**. To cancel, pass an **AbortSignal** into your pipeline (e.g. as first argument) and have each step check **signal.aborted** or pass it to **fetch**. When a step rejects, the pipeline short-circuits and the returned promise rejects; there is no built-in “cancel pipeline” API.

### Result and AppError

**toResult** and **fromPromise** use **@simpill/errors.utils** **AppError** by default (via **mapError**). Use **Result&lt;T, AppError&gt;** so errors have **code**, **cause**, and **meta**. Example: `const res = await fromPromise(() => fetchUser(id)); if (isErr(res)) logger.error({ code: res.error.code, cause: res.error.cause }); else setUser(res.value);`. For custom codes pass **mapError**: `fromPromise(fn, (e) => new AppError("Fetch failed", { code: ERROR_CODES.NOT_FOUND, cause: e }))`.

### Chaining Results

There is no **flatMap**/chain helper. Chain by sequencing **fromPromise** and branching:

```ts
const a = await fromPromise(() => loadUser(id));
if (isErr(a)) return a;
const b = await fromPromise(() => loadOrders(a.value.id));
if (isErr(b)) return b;
return ok({ user: a.value, orders: b.value });
```

Or use **pipeAsync** with steps that return **Result** and a final **unwrapOr** or single **isOk** check at the end.

---

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | Result, pipeAsync, strategySelector |
| [02-core-patterns.ts](./examples/02-core-patterns.ts) | Adapter, Decorator, Observer, State, Mediator |
| [03-structure-proxy.ts](./examples/03-structure-proxy.ts) | Composite, Proxy |
| [04-creational.ts](./examples/04-creational.ts) | Builder, Facade, Flyweight |
| [05-result-chain-command.ts](./examples/05-result-chain-command.ts) | toResult, fromPromise, raceOk, chainOfResponsibility, runCommandWithUndo |

---

## Development

```bash
npm install
npm test
npm run build
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/<file>.ts` (see table above).
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

---

## License

ISC
