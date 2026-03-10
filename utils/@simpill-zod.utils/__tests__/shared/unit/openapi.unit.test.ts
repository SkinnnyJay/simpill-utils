import { z } from "zod";
import { withOpenApiMetadata } from "../../../src/shared";

describe("openapi", () => {
  it("returns same schema when metadata attached", () => {
    const schema = z.string();
    const withMeta = withOpenApiMetadata(schema, { description: "A string" });
    expect(withMeta.parse("x")).toBe("x");
  });
});
