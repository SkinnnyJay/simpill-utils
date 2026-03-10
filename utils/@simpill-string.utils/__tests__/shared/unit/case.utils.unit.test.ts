import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  toTitleCase,
} from "../../../src/shared/case.utils";

describe("case utils", () => {
  it("converts strings to common cases", () => {
    const input = "hello_world-fooBar Baz";
    expect(toCamelCase(input)).toBe("helloWorldFooBarBaz");
    expect(toPascalCase(input)).toBe("HelloWorldFooBarBaz");
    expect(toKebabCase(input)).toBe("hello-world-foo-bar-baz");
    expect(toSnakeCase(input)).toBe("hello_world_foo_bar_baz");
    expect(toTitleCase(input)).toBe("Hello World Foo Bar Baz");
  });

  it("returns empty string for empty input", () => {
    expect(toCamelCase("")).toBe("");
    expect(toPascalCase("")).toBe("");
  });
});
