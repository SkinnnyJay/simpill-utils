import { describe, expect, it } from "vitest";
import * as Async from "@simpill/async.utils";

describe("@simpill/async.utils", () => {
  it("resolves and delay resolves after ms", async () => {
    expect(Async).toBeDefined();
    expect(typeof Async.delay).toBe("function");
    const start = Date.now();
    await Async.delay(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(8);
  });
});
