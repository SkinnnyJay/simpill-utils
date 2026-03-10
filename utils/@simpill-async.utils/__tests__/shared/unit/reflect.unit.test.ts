import { reflect } from "../../../src/shared/reflect";

describe("reflect", () => {
  it("reflects a fulfilled promise", async () => {
    const result = await reflect(Promise.resolve(42));
    expect(result).toEqual({ status: "fulfilled", value: 42 });
  });

  it("reflects a rejected promise", async () => {
    const result = await reflect(Promise.reject(new Error("fail")));
    expect(result.status).toBe("rejected");
  });
});
