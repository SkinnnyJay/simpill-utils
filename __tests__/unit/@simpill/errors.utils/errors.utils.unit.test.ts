import { describe, expect, it } from "vitest";
import * as Errors from "@simpill/errors.utils";

describe("@simpill/errors.utils", () => {
  it("resolves and serializeError returns object", () => {
    expect(Errors).toBeDefined();
    expect(typeof Errors.serializeError).toBe("function");
    const out = Errors.serializeError(new Error("test"));
    expect(out).toBeDefined();
    expect(typeof out).toBe("object");
    expect("message" in out || "name" in out).toBe(true);
  });
});
