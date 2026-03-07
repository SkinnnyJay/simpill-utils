import { describe, expect, it } from "vitest";
import * as Time from "@simpill/time.utils";

describe("@simpill/time.utils", () => {
  it("resolves and getUnixTimeStamp returns number", () => {
    expect(Time).toBeDefined();
    expect(typeof Time.getUnixTimeStamp).toBe("function");
    const ts = Time.getUnixTimeStamp();
    expect(typeof ts).toBe("number");
    expect(ts).toBeGreaterThan(0);
  });
});
