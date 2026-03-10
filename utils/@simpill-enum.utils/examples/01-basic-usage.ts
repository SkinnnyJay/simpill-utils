/**
 * @simpill/enum.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { getEnumValue, isValidEnumValue } from "@simpill/enum.utils";

const Status = { Active: "active", Inactive: "inactive", Pending: "pending" } as const;

const v = getEnumValue(Status, "active");
console.log("getEnumValue(Status, 'active'):", v); // "active"

const v2 = getEnumValue(Status, "unknown", Status.Pending);
console.log("getEnumValue(Status, 'unknown', Pending):", v2); // "pending"

console.log("isValidEnumValue(Status, 'active'):", isValidEnumValue(Status, "active")); // true
console.log("isValidEnumValue(Status, 'x'):", isValidEnumValue(Status, "x")); // false
