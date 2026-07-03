## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fpatterns.utils.svg)](https://www.npmjs.com/package/@simpill/patterns.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-patterns.utils)
</p>

**npm**
```bash
npm install @simpill/patterns.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-patterns.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-patterns.utils` or `npm link` from that directory.

---

## Usage

```ts
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

## Import Paths

```ts
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

Full combinator set, neverthrow-parity, as tree-shakeable standalone functions over the same plain-object Result — no classes, no extra dependency:

- **Transform**: `map(r, fn)`, `mapErr(r, fn)`, `andThen(r, fn)` (flatMap; Err short-circuits), `orElse(r, fn)` (error recovery), `tap(r, fn)` / `tapErr(r, fn)` (side effects, result passes through).
- **Consume**: `match(r, onOk, onErr)` — exhaustive fold; both branches must be handled.
- **Aggregate**: `combine(results)` — Ok(values[]) or the first Err; `combineWithAllErrors(results)` — collects every error.
- **Interop**: `fromNullable(value, onNullish)`; `fromThrowable(fn, mapError?)` now takes an optional error mapper.

```ts
const r = andThen(parse(input), (n) => (n > 0 ? ok(n * 2) : err("must be positive")));
const msg = match(r, (v) => `got ${v}`, (e) => `failed: ${e}`);
```

**safeTry** emulates Rust's `?` operator — `yield* safeUnwrap(result)` unwraps an Ok or early-returns the Err:

```ts
const r = safeTry(function* () {
  const user = yield* safeUnwrap(parseUser(raw));
  const plan = yield* safeUnwrap(lookupPlan(user));
  return ok({ user, plan });
}); // Result<{user, plan}, ParseError | LookupError>
```

`safeTryAsync` is the same over an async generator (awaits allowed in the body).

### Async Result

**toResult**(promise, mapError?) and **fromPromise**(fn, mapError?) turn a Promise into **Promise&lt;Result&lt;T, AppError&gt;&gt;** (default **mapError** wraps to AppError). For chaining: **mapAsync**(r, asyncFn) transforms an Ok asynchronously, and **andThenAsync**(rOrPromise, fn) chains `Promise<Result>` steps linearly with Err short-circuit — no manual isOk checks between steps. Combine with **raceOk** for “first success.” For retry that returns Result use **@simpill/resilience.utils** **retryResult**.

### All exports

The **API Reference** above lists every public export. From **shared**: Result (ok, err, isOk, isErr, map, mapErr, andThen, orElse, tap, tapErr, match, unwrap, unwrapErr, unwrapOr, unwrapOrElse, combine, combineWithAllErrors, fromNullable, fromThrowable, mapAsync, andThenAsync, safeTry, safeTryAsync, safeUnwrap, toResult, fromPromise), pipeAsync, strategySelector, strategySelectorOptional, chainOfResponsibility (handled, unhandled), Command, Adapter, Builder, Decorator, Facade, Factory, Flyweight, Mediator, Observable, Proxy, StateMachine, Composite helpers, raceOk. Client/server re-export the same; see package **index** and **shared/index** for the full list.

### Unwrap (value or throw)

**unwrap**(r) returns the Ok value or throws (Error instances rethrown as-is; other error values wrapped with `cause`). **unwrapErr**(r) returns the Err value or throws on Ok. Prefer **unwrapOr**(r, fallback) / **unwrapOrElse**(r, (e) => fallback) or **match** at boundaries where throwing is not acceptable — unwrap is for the edges where an Err is a programmer error.

### pipeAsync and cancellation

**pipeAsync** composes async functions with **.then()**; it does **not** accept **AbortSignal**. To cancel, pass an **AbortSignal** into your pipeline (e.g. as first argument) and have each step check **signal.aborted** or pass it to **fetch**. When a step rejects, the pipeline short-circuits and the returned promise rejects; there is no built-in “cancel pipeline” API.

### Result and AppError

**toResult** and **fromPromise** use **@simpill/errors.utils** **AppError** by default (via **mapError**). Use **Result&lt;T, AppError&gt;** so errors have **code**, **cause**, and **meta**. Example: `const res = await fromPromise(() => fetchUser(id)); if (isErr(res)) logger.error({ code: res.error.code, cause: res.error.cause }); else setUser(res.value);`. For custom codes pass **mapError**: `fromPromise(fn, (e) => new AppError("Fetch failed", { code: ERROR_CODES.NOT_FOUND, cause: e }))`.

### Chaining Results

Sync: **andThen** chains Result-returning steps with Err short-circuit. Async: **andThenAsync** does the same over `Promise<Result>`:

```ts
const r = await andThenAsync(
  andThenAsync(fromPromise(() => loadUser(id)), (user) =>
    mapAsync(fromPromise(() => loadOrders(user.id)), async (orders) => ({ user, orders }))
  ),
  (both) => ok(both)
);
```

Or, flatter, with **safeTryAsync**:

```ts
const r = await safeTryAsync(async function* () {
  const user = yield* safeUnwrap(await fromPromise(() => loadUser(id)));
  const orders = yield* safeUnwrap(await fromPromise(() => loadOrders(user.id)));
  return ok({ user, orders });
});
```

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

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/<file>.ts` (see table above).
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill-utils/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill-utils/blob/main/docs/PACKAGE_README_STANDARD.md).

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
