/**
 * @simpill/errors.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { AppError, serializeError } from "@simpill/errors.utils";

const err = new AppError("Something failed", {
  code: "VALIDATION_ERROR",
  meta: { field: "email" },
});
console.log("AppError message:", err.message);
console.log("AppError code:", err.code);
console.log("AppError toJSON():", err.toJSON());

const serialized = serializeError(err, { includeStack: false });
console.log("serializeError:", serialized);

const plain = serializeError(new Error("Plain error"));
console.log("serializeError(Error):", plain.name, plain.message);
