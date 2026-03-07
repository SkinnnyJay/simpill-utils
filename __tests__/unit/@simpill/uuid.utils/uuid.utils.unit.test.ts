import { describe, expect, it } from "vitest";
import * as Uuid from "@simpill/uuid.utils";

describe("@simpill/uuid.utils", () => {
  it("resolves and generateUUID returns valid uuid string", () => {
    expect(Uuid).toBeDefined();
    expect(typeof Uuid.generateUUID).toBe("function");
    const id = Uuid.generateUUID();
    expect(typeof id).toBe("string");
    expect(Uuid.isUUID(id)).toBe(true);
  });
});
