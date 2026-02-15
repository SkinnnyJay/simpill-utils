/**
 * @simpill/patterns.utils - Creational pattern examples
 *
 * Use cases: stepwise config/fixtures (Builder), simplified API surface (Facade),
 * one instance per key (Flyweight: formatters, connections, parsers).
 *
 * Run: npx ts-node examples/04-creational.ts
 */

import {
  createBuilder,
  createFacade,
  createFacadeFrom,
  createFlyweightFactory,
} from "@simpill/patterns.utils";

// --- Builder: chainable set/merge, then build (config objects, test fixtures) ---
const user = createBuilder({ name: "Ada", role: "engineer" }).set("role", "architect").build();
console.log("builder:", user);

// --- Facade: typed "simplified surface" over a subsystem ---
const math = createFacade({
  add: (a: number, b: number) => a + b,
  mul: (a: number, b: number) => a * b,
});
console.log("facade:", math.add(2, 3));

const withDeps = createFacadeFrom({ base: 10 }, ({ base }) => ({
  add: (value: number) => base + value,
}));
console.log("facade from deps:", withDeps.add(5));

// --- Flyweight: reuse instance per key (e.g. Intl.NumberFormat per locale) ---
const flyweight = createFlyweightFactory(
  (key: { id: string }) => key.id,
  (key) => ({ id: key.id, createdAt: Date.now() })
);
const a = flyweight.get({ id: "a" });
const b = flyweight.get({ id: "a" });
console.log("flyweight shared:", a === b);
