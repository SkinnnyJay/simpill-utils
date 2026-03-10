import { formatRichText, RichTextBuilder } from "../../../src/shared/rich-text";
import { stripAnsi } from "../../../src/shared/string.utils";

describe("rich text", () => {
  it("formats ANSI output", () => {
    const formatted = formatRichText("hello", { bold: true, color: "red" }, "ansi");
    expect(formatted).toBe("\u001b[1;31mhello\u001b[0m");
  });

  it("formats HTML output", () => {
    const formatted = formatRichText("hello", { underline: true, color: "blue" }, "html");
    const expected = '<span style="color:blue;text-decoration:underline">hello</span>';
    expect(formatted).toBe(expected);
  });

  it("builds rich text segments", () => {
    const builder = new RichTextBuilder();
    builder.append("Hello ", { bold: true }).append("World", { color: "green" });
    expect(builder.toPlain()).toBe("Hello World");
    expect(stripAnsi(builder.toAnsi())).toBe("Hello World");
    expect(builder.toHtml()).toContain("World");
  });
});
