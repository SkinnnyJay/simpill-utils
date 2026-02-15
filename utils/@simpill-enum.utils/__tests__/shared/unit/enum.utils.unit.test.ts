import { EnumHelper, getEnumValue, isValidEnumValue } from "../../../src/shared";

const TestEnum = { A: "a", B: "b", C: "c" } as const;
type TestEnum = (typeof TestEnum)[keyof typeof TestEnum];

describe("enum.utils", () => {
  describe("getEnumValue", () => {
    it("returns value when valid", () => {
      expect(getEnumValue(TestEnum, "a")).toBe("a");
      expect(getEnumValue(TestEnum, "b")).toBe("b");
    });
    it("returns undefined when invalid and no default", () => {
      expect(getEnumValue(TestEnum, "x")).toBeUndefined();
    });
    it("returns default when invalid", () => {
      expect(getEnumValue(TestEnum, "x", TestEnum.A)).toBe("a");
    });
  });

  describe("isValidEnumValue", () => {
    it("returns true for valid values", () => {
      expect(isValidEnumValue(TestEnum, "a")).toBe(true);
      expect(isValidEnumValue(TestEnum, "b")).toBe(true);
    });
    it("returns false for invalid values", () => {
      expect(isValidEnumValue(TestEnum, "x")).toBe(false);
    });
  });

  describe("EnumHelper", () => {
    it("exposes getEnumValue and isValidEnumValue", () => {
      expect(EnumHelper.getEnumValue(TestEnum, "a")).toBe("a");
      expect(EnumHelper.isValidEnumValue(TestEnum, "x")).toBe(false);
    });
  });
});
