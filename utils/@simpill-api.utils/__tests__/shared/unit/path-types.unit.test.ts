/**
 * @file Path Types Unit Tests
 * @description Compile-time checks for PathParams/HasPathParams. These are
 * type-only utilities; the "test" is that this file type-checks, plus a
 * couple of runtime identity assertions so tsc/jest both catch a regression.
 */

import type { HasPathParams, PathParams } from "../../../src/shared/path-types";

describe("PathParams / HasPathParams (compile-time)", () => {
  it("type-checks: single param", () => {
    type T = PathParams<"/users/:id">;
    const value: T = { id: "abc" };
    expect(value).toEqual({ id: "abc" });
  });

  it("type-checks: multiple params", () => {
    type T = PathParams<"/users/:id/posts/:postId">;
    const value: T = { id: "1", postId: "2" };
    expect(value).toEqual({ id: "1", postId: "2" });
  });

  it("type-checks: no params yields an empty-object type", () => {
    type T = PathParams<"/health">;
    const value: T = {};
    expect(value).toEqual({});
  });

  it("HasPathParams narrows to a literal boolean", () => {
    type WithParams = HasPathParams<"/users/:id">;
    type WithoutParams = HasPathParams<"/health">;
    const withParams: WithParams = true;
    const withoutParams: WithoutParams = false;
    expect(withParams).toBe(true);
    expect(withoutParams).toBe(false);
  });
});
