import { getAnnotation, hasAnnotation, setAnnotation } from "../../../src/shared/annotations.utils";

describe("annotations.utils", () => {
  it("set and get annotation", () => {
    const obj = {};
    setAnnotation(obj, "tag", "hello");
    expect(hasAnnotation(obj, "tag")).toBe(true);
    expect(getAnnotation<string>(obj, "tag")).toBe("hello");
  });
});
