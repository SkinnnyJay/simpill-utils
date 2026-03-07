import { describe, expect, it } from "vitest";
import { getEdgeString } from "@simpill/env.utils/client";
import { delay } from "@simpill/async.utils";

describe("env.utils + async.utils integration", () => {
  it("env value is string and delay completes", async () => {
    const envVal = getEdgeString("NODE_ENV", "test");
    expect(typeof envVal).toBe("string");
    await delay(5);
    expect(envVal).toBeDefined();
  });
});
