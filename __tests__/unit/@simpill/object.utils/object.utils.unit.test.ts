import { describe, expect, it } from "vitest";
import * as ObjectUtils from "@simpill/object.utils";

describe("@simpill/object.utils", () => {
  it("resolves and pick returns subset", () => {
    expect(ObjectUtils).toBeDefined();
    expect(typeof ObjectUtils.pick).toBe("function");
    const out = ObjectUtils.pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);
    expect(out).toEqual({ a: 1, c: 3 });
  });
});
