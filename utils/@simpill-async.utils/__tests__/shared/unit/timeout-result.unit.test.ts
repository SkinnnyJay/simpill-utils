import { timeoutResult } from "../../../src/shared/timeout-result";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("timeoutResult", () => {
  it("returns fulfilled status when promise resolves first", async () => {
    const result = await timeoutResult(Promise.resolve("ok"), 10);
    expect(result).toEqual({ status: "fulfilled", value: "ok" });
  });

  it("returns rejected status when promise rejects first", async () => {
    const result = await timeoutResult(Promise.reject(new Error("fail")), 10);
    expect(result.status).toBe("rejected");
  });

  it("returns timed_out status when timeout wins", async () => {
    const result = await timeoutResult(
      wait(20).then(() => "late"),
      5,
    );
    expect(result.status).toBe("timed_out");
  });
});
