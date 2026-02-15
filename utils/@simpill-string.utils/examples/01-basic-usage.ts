/**
 * @simpill/string.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  formatString,
  StringBuilder,
  slugify,
  toCamelCase,
  truncate,
  truncateWords,
} from "@simpill/string.utils";

const builder = new StringBuilder()
  .append("Hello ")
  .appendFormat("{name}", { name: "Ada" })
  .appendLine("!");
console.log("StringBuilder:", builder.toString());

console.log("formatString('User: {0}', ['Ada']):", formatString("User: {0}", ["Ada"]));
console.log("toCamelCase('hello-world'):", toCamelCase("hello-world"));
console.log("truncate('hello world', 8):", truncate("hello world", 8));
console.log("truncateWords('one two three', 2):", truncateWords("one two three", 2));
console.log("slugify('Creme brulee'):", slugify("Creme brulee"));
