import { anyFulfilled, someFulfilled } from "../../../src/shared/any-some";

describe("anyFulfilled", () => {
  it("resolves with first fulfilled result", async () => {
    const result = await anyFulfilled([Promise.reject(new Error("fail")), Promise.resolve("ok")]);
    expect(result.value).toBe("ok");
    expect(result.index).toBe(1);
  });

  it("rejects when all reject", async () => {
    await expect(
      anyFulfilled([Promise.reject(new Error("a")), Promise.reject(new Error("b"))]),
    ).rejects.toMatchObject({ name: "AggregateError" });
  });
});

describe("someFulfilled", () => {
  it("resolves when count is met", async () => {
    const result = await someFulfilled(
      [Promise.resolve(1), Promise.resolve(2), Promise.reject(new Error("fail"))],
      2,
    );
    expect(result.values.sort()).toEqual([1, 2]);
    expect(result.fulfilledCount).toBe(2);
  });

  it("rejects when count cannot be met", async () => {
    await expect(
      someFulfilled([Promise.resolve(1), Promise.reject(new Error("fail"))], 2),
    ).rejects.toMatchObject({ name: "AggregateError" });
  });
});
