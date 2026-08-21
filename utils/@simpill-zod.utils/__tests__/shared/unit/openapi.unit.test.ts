import { z } from "zod";
import { withOpenApiMetadata } from "../../../src/shared";

describe("openapi", () => {
  it("returns same schema when metadata attached", () => {
    const schema = z.string();
    const withMeta = withOpenApiMetadata(schema, { description: "A string" });
    expect(withMeta.parse("x")).toBe("x");
  });
});

import { z as z5 } from "zod";
import { getOpenApiMetadata } from "../../../src/shared";

describe("openapi (uplift fixes: metadata actually stored)", () => {
  it("stores and retrieves metadata (previously discarded entirely)", () => {
    const s = withOpenApiMetadata(z5.string(), { description: "a name", example: "Ada" });
    expect(getOpenApiMetadata(s)).toEqual({ description: "a name", example: "Ada" });
  });
  it("applies description via zod's native .describe()", () => {
    const s = withOpenApiMetadata(z5.string(), { description: "user email" });
    expect(s.description).toBe("user email");
  });
  it("schema still validates identically", () => {
    const s = withOpenApiMetadata(z5.string().min(2), { example: "ok" });
    expect(s.parse("ok")).toBe("ok");
    expect(s.safeParse("x").success).toBe(false);
  });
  it("returns undefined for schemas without metadata", () => {
    expect(getOpenApiMetadata(z5.number())).toBeUndefined();
  });
});
