/**
 * @simpill/enum.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  assertEnumValue,
  enumKeys,
  enumValues,
  getEnumKey,
  getEnumValue,
  isValidEnumValue,
} from "@simpill/enum.utils";

const Status = { Active: "active", Inactive: "inactive", Pending: "pending" } as const;

const v = getEnumValue(Status, "active");
console.log("getEnumValue(Status, 'active'):", v); // "active"

const v2 = getEnumValue(Status, "unknown", Status.Pending);
console.log("getEnumValue(Status, 'unknown', Pending):", v2); // "pending"

console.log("isValidEnumValue(Status, 'active'):", isValidEnumValue(Status, "active")); // true
console.log("isValidEnumValue(Status, 'x'):", isValidEnumValue(Status, "x")); // false

// Numeric enums: reverse-mapping safe
enum HttpStatus {
  OK = 200,
  NotFound = 404,
}

console.log("isValidEnumValue(HttpStatus, 404):", isValidEnumValue(HttpStatus, 404)); // true
console.log("isValidEnumValue(HttpStatus, 'NotFound'):", isValidEnumValue(HttpStatus, "NotFound")); // false
console.log("getEnumKey(HttpStatus, 404):", getEnumKey(HttpStatus, 404)); // "NotFound"
console.log("enumValues(HttpStatus):", enumValues(HttpStatus)); // [200, 404]
console.log("enumKeys(HttpStatus):", enumKeys(HttpStatus)); // ["OK", "NotFound"]
console.log("assertEnumValue(HttpStatus, 200):", assertEnumValue(HttpStatus, 200)); // 200
