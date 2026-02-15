describe("enums", () => {
  const Status = { A: "a", B: "b" } as const;

  it("getEnumValue returns value when valid", () => {
    const { getEnumValue } = require("../../../src/shared");
    expect(getEnumValue(Status, "a")).toBe("a");
  });

  it("getEnumValue returns default when invalid", () => {
    const { getEnumValue } = require("../../../src/shared");
    expect(getEnumValue(Status, "x", "a")).toBe("a");
  });

  it("isValidEnumValue guards correctly", () => {
    const { isValidEnumValue } = require("../../../src/shared");
    expect(isValidEnumValue(Status, "a")).toBe(true);
    expect(isValidEnumValue(Status, "x")).toBe(false);
  });
});
