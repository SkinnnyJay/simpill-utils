import { pipeAsync } from "../../../src/shared/pipe-async";

describe("pipeAsync", () => {
  it("should run single function", async () => {
    const fn = pipeAsync((x: number) => Promise.resolve(x + 1));
    expect(await fn(1)).toBe(2);
  });

  it("should chain multiple functions", async () => {
    const fn = pipeAsync(
      (x: number) => Promise.resolve(x + 1),
      (x: number) => Promise.resolve(x * 2),
      (x: number) => Promise.resolve(String(x))
    );
    expect(await fn(1)).toBe("4"); // (1+1)*2 = 4
  });

  it("should short-circuit on rejection", async () => {
    const fn = pipeAsync(
      (x: number) => Promise.resolve(x + 1),
      () => Promise.reject(new Error("fail")),
      (x: number) => Promise.resolve(x)
    );
    await expect(fn(1)).rejects.toThrow("fail");
  });
});
