/**
 * Basic Zod helpers: schema builders, safeParseResult, flattenZodError.
 */

import {
  flattenZodError,
  numberField,
  safeParseResult,
  stringField,
  trimString,
} from "@simpill/zod.utils";
import { z } from "zod";

const UserSchema = z.object({
  name: trimString(stringField(z.string().min(1), "unknown")),
  age: numberField(z.number().min(0).max(150), 0),
});

const input = { name: "  Jane  ", age: 30 };
const result = safeParseResult(UserSchema, input);

if (result.success) {
  console.log("Parsed:", result.data);
} else {
  console.log("Errors:", flattenZodError(result.error));
}
