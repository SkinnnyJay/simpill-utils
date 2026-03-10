import { AppError, ERROR_CODES } from "@simpill/errors.utils";
import { timeoutResultToResult } from "../../../src/shared/timeout-result-to-result";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("timeoutResultToResult", () => {
  it("returns ok for resolved promise", async () => {
    const result = await timeoutResultToResult(Promise.resolve("ok"), 10);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("ok");
    }
  });

  it("returns err for rejected promise", async () => {
    const result = await timeoutResultToResult(Promise.reject(new Error("fail")), 10);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe(ERROR_CODES.INTERNAL);
    }
  });

  it("returns timeout AppError when timed out", async () => {
    const result = await timeoutResultToResult(wait(20), 5);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe(ERROR_CODES.TIMEOUT);
    }
  });
});
