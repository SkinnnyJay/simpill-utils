/**
 * @simpill/test.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  createEnricher,
  createSeededRandom,
  createTestPatterns,
  randomInt,
  randomString,
} from "@simpill/test.utils";

// Seeded random for deterministic tests
const rng = createSeededRandom(42);
console.log("randomInt(1, 10, rng):", randomInt(1, 10, rng));
console.log("randomString(8, rng):", randomString(8, rng));

// Test patterns: fixture factory
const patterns = createTestPatterns();
type User = { id: number; name: string };
const userFixture = patterns.createFixture<User>({ id: 1, name: "Test" });
const u = userFixture({ name: "Alice" });
console.log("fixture:", u); // { id: 1, name: "Alice" }

// Enricher: build objects with defaults and overrides
const enricher = createEnricher<User>({ defaults: { id: 0, name: "Anonymous" } });
const u2 = enricher.enrich({ name: "Bob" });
console.log("enricher:", u2); // { id: 0, name: "Bob" }
