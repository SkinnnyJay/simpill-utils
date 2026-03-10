import { invalid, valid, validateString } from "../../../src/shared/data.validate";

describe("data.validate", () => {
  it("validateString", () => {
    expect(validateString("x")).toEqual({ ok: true, value: "x" });
    expect(validateString(1).ok).toBe(false);
  });

  it("valid/invalid", () => {
    expect(valid(1)).toEqual({ ok: true, value: 1 });
    expect(invalid("err")).toEqual({ ok: false, message: "err" });
  });
});
