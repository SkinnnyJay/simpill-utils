import { createAdapter } from "../../../src/shared/create-adapter";

describe("createAdapter", () => {
  it("should return same implementation", () => {
    const impl = { get: (k: string) => k, set: () => {} };
    const adapter = createAdapter(impl);
    expect(adapter).toBe(impl);
  });
});
