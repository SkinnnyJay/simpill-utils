import type { z } from "zod";
import type { ApiSchema } from "../shared/types";

/** Narrow schema field to ZodType for .parse(); route array is heterogeneous so we narrow at use site. */
export function parseWithSchema<T>(
  schema: ApiSchema[keyof ApiSchema] | undefined,
  raw: unknown
): T {
  if (!schema) return raw as T;
  return (schema as z.ZodType<T>).parse(raw) as T;
}
