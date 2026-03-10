import { AppError } from "@simpill/errors.utils";
import { retryResult } from "../../../src/shared/retry-result";

describe("retryResult", () => {
  it("returns ok when retry eventually succeeds", async () => {
    let attempts = 0;
    const result = await retryResult(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error("fail");
      return "ok";
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("ok");
  });

  it("returns err when retries exhausted", async () => {
    const result = await retryResult(
      async () => {
        throw new Error("fail");
      },
      { maxAttempts: 2 },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(AppError);
  });
});
