import { describe, expect, it } from "vitest";
import { serializeError, AppError } from "@simpill/errors.utils";
import { generateUUID, isUUID } from "@simpill/uuid.utils";

describe("errors.utils + uuid.utils integration", () => {
  it("serializeError and generateUUID work together", () => {
    const id = generateUUID();
    expect(isUUID(id)).toBe(true);
    const err = new AppError("test", { code: "E_TEST", meta: { requestId: id } });
    const serialized = serializeError(err);
    expect(serialized).toBeDefined();
    expect(typeof serialized).toBe("object");
  });
});
