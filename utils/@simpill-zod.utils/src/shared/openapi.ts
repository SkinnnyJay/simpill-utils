/**
 * OpenAPI metadata helpers: attach and retrieve schema metadata without
 * requiring zod-openapi as a dependency.
 */

import type { z } from "zod";

export type OpenApiMetadata = {
  description?: string;
  example?: unknown;
  [key: string]: unknown;
};

const registry = new WeakMap<z.ZodType, OpenApiMetadata>();

/**
 * Attaches OpenAPI-style metadata to a schema. `description` is applied via
 * zod's native .describe() — so it survives into zod-to-json-schema /
 * zod-openapi output — and the full metadata object is retrievable via
 * getOpenApiMetadata(). (Previously this function was a silent no-op: the
 * metadata argument was discarded entirely, so documented examples and
 * descriptions never reached generated OpenAPI specs.)
 */
export function withOpenApiMetadata<Schema extends z.ZodType>(
  schema: Schema,
  metadata: OpenApiMetadata
): Schema {
  const out =
    metadata.description !== undefined ? (schema.describe(metadata.description) as Schema) : schema;
  registry.set(out, metadata);
  return out;
}

/** Returns metadata previously attached with withOpenApiMetadata, or undefined. */
export function getOpenApiMetadata(schema: z.ZodType): OpenApiMetadata | undefined {
  return registry.get(schema);
}
