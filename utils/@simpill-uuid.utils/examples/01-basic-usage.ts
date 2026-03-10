/**
 * @simpill/uuid.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  compareUUIDs,
  generateUUID,
  generateUUIDv4,
  isUUID,
  parseUUID,
  validateUUID,
} from "@simpill/uuid.utils";

const id = generateUUID();
console.log("Generated:", id);

const v4 = generateUUIDv4();
console.log("v4:", v4);

console.log("isUUID(id):", isUUID(id)); // true
console.log("isUUID('not-uuid'):", isUUID("not-uuid")); // false

console.log("validateUUID(id):", validateUUID(id)); // true (does not throw)
console.log("validateUUID('bad'):", validateUUID("bad")); // false

console.log("parseUUID(id):", parseUUID(id)); // id
console.log("parseUUID('bad'):", parseUUID("bad")); // null

console.log("compareUUIDs(id, id):", compareUUIDs(id, id)); // true
console.log("compareUUIDs(id, v4):", compareUUIDs(id, v4)); // false
