import { describe, expect, it } from "vitest";
import * as ArrayUtils from "@simpill/array.utils";

describe("@simpill/array.utils", () => {
  it("resolves and unique returns deduped array", () => {
    expect(ArrayUtils).toBeDefined();
    expect(typeof ArrayUtils.unique).toBe("function");
    const out = ArrayUtils.unique([1, 2, 2, 3, 1]);
    expect(out).toEqual([1, 2, 3]);
  });
});
