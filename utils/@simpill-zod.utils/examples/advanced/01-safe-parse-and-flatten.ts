/**
 * Safe parse with error formatting and parseOrThrow.
 */

import { flattenZodError, formatZodError, parseOrThrow, safeParseResult } from "@simpill/zod.utils";
import { z } from "zod";

const ConfigSchema = z.object({
  port: z.number().int().positive(),
  host: z.string().min(1),
});

const raw = { port: 3000, host: "localhost" };
const result = safeParseResult(ConfigSchema, raw);

if (result.success) {
  const config = result.data;
  console.log("Config:", config);
} else {
  console.log("One-line:", formatZodError(result.error));
  console.log("By path:", flattenZodError(result.error));
}

// Or throw on invalid
const config = parseOrThrow(ConfigSchema, raw);
console.log("Config:", config);
