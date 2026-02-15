/**
 * @simpill/object.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  deepMerge,
  getByPath,
  getByPathOrDefault,
  isPlainObject,
  omit,
  pick,
  setByPath,
} from "@simpill/object.utils";

const user = { id: 1, name: "Alice", email: "a@b.com" };
console.log("pick(user, ['id', 'name']):", pick(user, ["id", "name"]));
console.log("omit(user, ['email']):", omit(user, ["email"]));

const nested = { a: { b: { c: 1 } } };
console.log("getByPath(nested, 'a.b.c'):", getByPath(nested, "a.b.c"));
console.log("getByPathOrDefault(nested, 'a.x', 0):", getByPathOrDefault(nested, "a.x", 0));
setByPath(nested, "a.b.d", 2);
console.log("after setByPath:", getByPath(nested, "a.b.d"));

const merged = deepMerge({ a: 1, b: { x: 1 } }, { b: { y: 2 } });
console.log("deepMerge:", merged);

console.log("isPlainObject({}):", isPlainObject({}));
console.log("isPlainObject([]):", isPlainObject([]));
