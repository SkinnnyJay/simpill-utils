import { describe, expect, it } from "vitest";
import * as StringUtils from "@simpill/string.utils";

describe("@simpill/string.utils", () => {
  it("resolves and exports usable functions", () => {
    expect(StringUtils).toBeDefined();
    expect(typeof StringUtils).toBe("object");
    const keys = Object.keys(StringUtils).filter((k) => typeof (StringUtils as Record<string, unknown>)[k] === "function");
    expect(keys.length).toBeGreaterThan(0);
  });
});
