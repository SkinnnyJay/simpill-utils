/**
 * OpenAPI metadata helpers. Use with zod-openapi when available (optional peer).
 * When zod-openapi is not installed, these are no-ops that return the same schema.
 */

import type { z } from "zod";

type OpenApiMetadata = {
  description?: string;
  example?: unknown;
  [key: string]: unknown;
};

/**
 * Attaches OpenAPI-style metadata to a schema. If zod-openapi is used elsewhere,
 * extend this to call .openapi() when available. This implementation only
 * returns the schema unchanged so the package works without zod-openapi.
 */
export function withOpenApiMetadata<Schema extends z.ZodType>(
  schema: Schema,
  _metadata: OpenApiMetadata
): Schema {
  return schema;
}
