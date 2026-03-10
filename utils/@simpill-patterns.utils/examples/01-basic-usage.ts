/**
 * @simpill/patterns.utils - Basic usage
 *
 * Use cases: return success/failure without throwing (Result), async pipelines (pipeAsync),
 * key-based dispatch (strategySelector).
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { err, isOk, ok, pipeAsync, strategySelector, unwrapOr } from "@simpill/patterns.utils";

// --- Result: ok / err ---
// Use case: API handlers, parsers, validation — return Result instead of throwing
const r = ok(42);
console.log("isOk(ok(42)):", isOk(r)); // true
if (isOk(r)) console.log("value:", r.value);

const e = err(new Error("failed"));
console.log("unwrapOr(err(...), 0):", unwrapOr(e, 0)); // 0

// --- pipeAsync: async composition ---
// Use case: validate → enrich → save; or fetch → parse → transform
const addOne = (n: number) => Promise.resolve(n + 1);
const double = (n: number) => Promise.resolve(n * 2);
const pipeline = pipeAsync(addOne, double);
pipeline(5).then((v) => console.log("pipeAsync(5):", v)); // 12

// --- strategySelector: dispatch by key ---
// Use case: API version/action routing, file type handlers, op codes (add/mul/sub)
type Action = "add" | "mul";
const compute = strategySelector<Action, [number, number], number>({
  add: ([a, b]) => a + b,
  mul: ([a, b]) => a * b,
});
console.log("strategySelector add:", compute("add", [2, 3])); // 5
console.log("strategySelector mul:", compute("mul", [2, 3])); // 6
