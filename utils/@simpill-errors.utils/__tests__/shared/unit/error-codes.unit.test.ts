import { createErrorCodeMap, ERROR_CODES, type ErrorCode } from "../../../src/shared/error-codes";

describe("error-codes", () => {
  describe("ERROR_CODES", () => {
    it("should contain expected codes", () => {
      expect(ERROR_CODES.BAD_REQUEST).toBe("BAD_REQUEST");
      expect(ERROR_CODES.NOT_FOUND).toBe("NOT_FOUND");
      expect(ERROR_CODES.INTERNAL).toBe("INTERNAL");
    });
  });

  describe("createErrorCodeMap", () => {
    it("should return defaults when no overrides", () => {
      const map = createErrorCodeMap({});
      expect(map.BAD_REQUEST).toBe("Bad request");
      expect(map.NOT_FOUND).toBe("Not found");
    });

    it("should override with provided messages", () => {
      const map = createErrorCodeMap({
        NOT_FOUND: "Resource not found",
        VALIDATION: "Invalid input",
      });
      expect(map.NOT_FOUND).toBe("Resource not found");
      expect(map.VALIDATION).toBe("Invalid input");
      expect(map.BAD_REQUEST).toBe("Bad request");
    });

    it("should have all ErrorCode keys", () => {
      const map = createErrorCodeMap({});
      const codes = Object.values(ERROR_CODES) as ErrorCode[];
      for (const code of codes) {
        expect(map[code]).toBeDefined();
        expect(typeof map[code]).toBe("string");
      }
    });
  });
});
