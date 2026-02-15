import { createDeferred } from "../../../src/shared/deferred";

describe("createDeferred", () => {
  it("resolves with provided value", async () => {
    const deferred = createDeferred<number>();
    deferred.resolve(42);
    await expect(deferred.promise).resolves.toBe(42);
  });

  it("rejects with provided error", async () => {
    const deferred = createDeferred<number>();
    deferred.reject(new Error("fail"));
    await expect(deferred.promise).rejects.toThrow("fail");
  });
});
