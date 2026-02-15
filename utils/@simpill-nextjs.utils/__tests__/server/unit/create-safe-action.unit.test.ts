/**
 * @file createSafeAction unit tests
 */

import { z } from "zod";
import { createSafeAction } from "../../../src/server/create-safe-action";

const InputSchema = z.object({ name: z.string().min(1), count: z.number().int().min(0) });

describe("createSafeAction", () => {
  it("returns data when validation passes and handler succeeds", async () => {
    const action = createSafeAction(InputSchema, async (input) => ({
      id: "1",
      name: input.name,
      count: input.count,
    }));
    const result = await action({ name: "a", count: 2 });
    expect(result.data).toEqual({ id: "1", name: "a", count: 2 });
    expect(result.error).toBeUndefined();
  });

  it("returns validation error when input is invalid", async () => {
    const action = createSafeAction(InputSchema, async () => ({}));
    const result = await action({ name: "", count: -1 });
    expect(result.data).toBeUndefined();
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toBeDefined();
    expect(result.error?.validation).toBeDefined();
  });

  it("returns server error when handler throws", async () => {
    const action = createSafeAction(InputSchema, async () => {
      throw new Error("db failed");
    });
    const result = await action({ name: "a", count: 0 });
    expect(result.data).toBeUndefined();
    expect(result.error?.message).toBe("db failed");
  });
});
