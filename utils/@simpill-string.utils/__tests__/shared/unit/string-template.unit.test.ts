import { StringTemplate } from "../../../src/shared/string-template";

describe("StringTemplate", () => {
  it("formats using the stored template", () => {
    const template = new StringTemplate("Hello {name}");
    expect(template.format({ name: "Ada" })).toBe("Hello Ada");
  });

  it("applies default options", () => {
    const template = new StringTemplate("Hello {missing}", {
      onMissing: "empty",
    });
    expect(template.format({})).toBe("Hello ");
  });

  it("overrides options per call", () => {
    const template = new StringTemplate("Hello {missing}");
    expect(template.format({}, { onMissing: "empty" })).toBe("Hello ");
  });
});
