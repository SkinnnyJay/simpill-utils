import { StringBuilder } from "../../../src/shared/string-builder";

describe("StringBuilder", () => {
  it("appends and prepends values", () => {
    const builder = new StringBuilder("world");
    builder.prepend("hello ");
    builder.append("!");
    expect(builder.toString()).toBe("hello world!");
  });

  it("supports appendLine and length tracking", () => {
    const builder = new StringBuilder();
    builder.appendLine("alpha").appendLine("beta");
    expect(builder.toString()).toBe("alpha\nbeta\n");
    expect(builder.length).toBe("alpha\nbeta\n".length);
  });

  it("supports appendFormat", () => {
    const builder = new StringBuilder();
    builder.appendFormat("Hello {name}", { name: "Ada" });
    expect(builder.toString()).toBe("Hello Ada");
  });

  it("clears content", () => {
    const builder = new StringBuilder("data");
    builder.clear();
    expect(builder.isEmpty()).toBe(true);
    expect(builder.toString()).toBe("");
  });
});
