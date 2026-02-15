import { z } from "zod";
import {
  flattenZodError,
  lowerString,
  numberField,
  safeParseResult,
  trimString,
} from "../../../src/shared";

describe("composed schema integration", () => {
  const UserSchema = z.object({
    name: trimString(z.string().min(1)),
    email: lowerString(z.string().email()),
    age: numberField(z.number().min(0).max(150), 0),
  });

  it("parses valid input", () => {
    const result = safeParseResult(UserSchema, {
      name: "  Jane  ",
      email: "Jane@Example.COM",
      age: 30,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane");
      expect(result.data.email).toBe("jane@example.com");
      expect(result.data.age).toBe(30);
    }
  });

  it("flattens errors for invalid input", () => {
    const result = safeParseResult(UserSchema, { name: "  ", email: "bad", age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const flat = flattenZodError(result.error);
      expect(Object.keys(flat).length).toBeGreaterThan(0);
    }
  });
});
