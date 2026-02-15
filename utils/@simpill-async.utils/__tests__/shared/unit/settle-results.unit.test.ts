import { AppError } from "@simpill/errors.utils";
import { settleResults } from "../../../src/shared/settle-results";

describe("settleResults", () => {
  it("returns results for fulfilled and rejected promises", async () => {
    const results = await settleResults([Promise.resolve(1), Promise.reject(new Error("nope"))]);
    expect(results).toHaveLength(2);
    expect(results[0]?.ok).toBe(true);
    expect(results[1]?.ok).toBe(false);
    if (results[1] && !results[1].ok) {
      expect(results[1].error).toBeInstanceOf(AppError);
    }
  });
});
