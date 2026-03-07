import { describe, expect, it } from "vitest";
import { pick } from "@simpill/object.utils";
import { unique, chunk } from "@simpill/array.utils";

describe("object.utils + array.utils integration", () => {
  it("pick then unique keys and chunk work together", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const picked = pick(obj, ["a", "c"]);
    const keys = unique(Object.keys(picked));
    expect(keys).toHaveLength(2);
    const chunks = chunk(keys, 1);
    expect(chunks).toHaveLength(2);
    expect(chunks.flat()).toEqual(keys);
  });
});
