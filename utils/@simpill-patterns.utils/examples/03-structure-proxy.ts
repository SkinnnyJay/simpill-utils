/**
 * @simpill/patterns.utils - Composite & Proxy examples
 *
 * Use cases: tree structures (UI sections, AST, categories), method interception (logging, metrics).
 *
 * Run: npx ts-node examples/03-structure-proxy.ts
 */

import {
  addChild,
  createComposite,
  createMethodProxy,
  traverseComposite,
} from "@simpill/patterns.utils";

// --- Composite: tree of nodes (value + children); traverse, map, reduce ---
const root = createComposite("root");
const a = createComposite("a");
const b = createComposite("b");
addChild(root, a);
addChild(root, b);
traverseComposite(root, (node) => console.log("node:", node.value));

// --- Proxy: intercept method calls (logging, timing, error handling) ---
const target = {
  multiply: (x: number, y: number) => x * y,
};
const proxied = createMethodProxy(target, {
  before: (method, args) => console.log("before", method, args),
  after: (method, _args, result) => console.log("after", method, result),
});
proxied.multiply(2, 4);
