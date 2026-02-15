import { noop } from "../../../src/shared/noop";

describe("noop", () => {
  it("returns undefined", () => {
    expect(noop()).toBeUndefined();
  });
  it("can be used as callback", () => {
    [1, 2, 3].forEach(noop);
  });
});
