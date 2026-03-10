/**
 * @simpill/data.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { mergeConfigLayers, valid, validateNumber, withDefaults } from "@simpill/data.utils";

// Validation
const r = validateNumber(42);
if (r.ok) console.log("validateNumber(42):", r.value); // 42

const r2 = validateNumber("not a number");
if (!r2.ok) console.log("validateNumber('...'):", r2.message);

// withDefaults
const base = { a: 1, b: 2 };
const full = withDefaults(base, { b: 99, c: 3 });
console.log("withDefaults:", full); // { a: 1, b: 2, c: 3 }

// mergeConfigLayers (later overrides earlier)
const merged = mergeConfigLayers([{ port: 3000 }, { port: 4000, host: "localhost" }]);
console.log("mergeConfigLayers:", merged); // { port: 4000, host: "localhost" }

// valid / result type
const result = valid(100);
if (result.ok) console.log("valid(100):", result.value);
