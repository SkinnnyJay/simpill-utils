import { describe, expect, it } from "vitest";
import { getEdgeString } from "@simpill/env.utils/client";
import * as Env from "@simpill/env.utils";

describe("@simpill/env.utils", () => {
  it("resolves and exports client getEdgeString", () => {
    expect(Env).toBeDefined();
    expect(typeof Env).toBe("object");
    const value = getEdgeString("NODE_ENV", "development");
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThanOrEqual(0);
  });
});
