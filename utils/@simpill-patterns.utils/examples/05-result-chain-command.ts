/**
 * @simpill/patterns.utils - Result (advanced), chain of responsibility, Command with undo, raceOk
 *
 * Use cases: async Result (toResult, fromPromise), first-Ok-wins (raceOk),
 * handler chains with fallback, undoable commands.
 *
 * Run: npx ts-node examples/05-result-chain-command.ts
 */

import {
  chainOfResponsibility,
  createCommand,
  err,
  fromPromise,
  handled,
  isOk,
  ok,
  raceOk,
  runCommandWithUndo,
  toResult,
  unhandled,
} from "../src/shared"; // In an app: import { ... } from "@simpill/patterns.utils";

// --- toResult / fromPromise: turn async code into Result<T, AppError> ---
async function demoResultAsync() {
  const fetchOk = () => Promise.resolve({ id: "1", name: "Alice" });
  const fetchFail = () => Promise.reject(new Error("Network error"));

  const resOk = await toResult(fetchOk());
  console.log("toResult(success):", isOk(resOk), isOk(resOk) ? resOk.value : resOk.error);

  const resFail = await fromPromise(fetchFail);
  console.log("fromPromise(fail):", isOk(resFail) ? resFail.value : resFail.error?.message);

  // Use case: API call in a handler
  const _loadUser = async (id: string) => {
    const result = await fromPromise(() => fetch(`/api/users/${id}`).then((r) => r.json()));
    return result;
  };
}

// --- raceOk: first Ok wins from multiple Result promises ---
async function demoRaceOk() {
  const _slowOk = () => new Promise((r) => setTimeout(() => r(ok(1)), 50));
  const fastOk = () => Promise.resolve(ok(2));
  const fastErr = () => Promise.resolve(err(new Error("fail")));

  const firstSuccess = await raceOk([fastErr(), fastErr(), fastOk()]);
  console.log("raceOk first success:", isOk(firstSuccess) ? firstSuccess.value : "all failed");

  const allFail = await raceOk([fastErr(), fastErr()]);
  console.log("raceOk all fail:", isOk(allFail) ? allFail.value : allFail.error?.message);

  // Use case: try primary then replica
  const fromPrimary = () => fromPromise(() => fetch("/api/primary/data").then((r) => r.json()));
  const fromReplica = () => fromPromise(() => fetch("/api/replica/data").then((r) => r.json()));
  const _data = await raceOk([fromPrimary(), fromReplica()]);
}

// --- chainOfResponsibility: first handler that returns handled(value) wins ---
function demoChain() {
  type Req = { kind: string; body: unknown };
  type Res = string;

  const handleA = (req: Req): { handled: true; value: Res } | { handled: false } =>
    req.kind === "A" ? handled("handled-by-A") : unhandled();

  const handleB = (req: Req): { handled: true; value: Res } | { handled: false } =>
    req.kind === "B" ? handled("handled-by-B") : unhandled();

  const chain = chainOfResponsibility<Req, Res>([handleA, handleB], {
    fallback: (req: Req) => `fallback-for-${req.kind}`,
  });

  console.log(chain({ kind: "A", body: null })); // "handled-by-A"
  console.log(chain({ kind: "B", body: null })); // "handled-by-B"
  console.log(chain({ kind: "C", body: null })); // "fallback-for-C"

  // Use case: auth chain (API key → session → anonymous)
  // Use case: content-type parsers (first that accepts the content-type returns parsed body)
}

// --- Command with undo: execute and capture undo for later ---
function demoCommandUndo() {
  let volume = 50;

  const setVolume = createCommand<number, number>({
    execute: (v: number) => {
      const prev = volume;
      volume = Math.max(0, Math.min(100, v));
      return prev;
    },
    undo: (_input: number, previousValue: number) => {
      volume = previousValue;
    },
  });

  const { result: previousVolume, undo } = runCommandWithUndo(setVolume, 80);
  console.log("after set 80:", volume, "previous was", previousVolume);
  undo?.();
  console.log("after undo:", volume);

  // Use case: undo stack in editor (push undo from runCommandWithUndo)
  // Use case: multi-step wizard; on cancel, run undos in reverse order
}

// Run demos (async where needed)
demoChain();
demoCommandUndo();

(async () => {
  await demoResultAsync();
  await demoRaceOk();
})();
