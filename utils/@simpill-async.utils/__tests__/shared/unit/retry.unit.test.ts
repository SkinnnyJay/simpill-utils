import { retry } from "../../../src/shared/retry";

describe("retry", () => {
  it("returns result on first success", async () => {
    const fn = jest.fn().mockResolvedValue(1);
    expect(await retry(fn, { maxAttempts: 3 })).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure then succeeds", async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue(2);
    expect(await retry(fn, { maxAttempts: 3, delayMs: 0 })).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after maxAttempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(retry(fn, { maxAttempts: 2, delayMs: 0 })).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
