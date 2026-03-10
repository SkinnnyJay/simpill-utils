import { promiseProps } from "../../../src/shared/props";

describe("promiseProps", () => {
  it("resolves object values", async () => {
    const result = await promiseProps({
      a: Promise.resolve(1),
      b: 2,
      c: Promise.resolve("ok"),
    });
    expect(result).toEqual({ a: 1, b: 2, c: "ok" });
  });
});
