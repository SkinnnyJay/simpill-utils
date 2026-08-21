/**
 * @file useIsomorphicLayoutEffect tests
 */

import { renderHook } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { useIsomorphicLayoutEffect } from "../../../src/client/use-isomorphic-layout-effect";

describe("useIsomorphicLayoutEffect", () => {
  it("is useLayoutEffect in a DOM environment", () => {
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });

  it("runs synchronously before paint like a layout effect", () => {
    const order: string[] = [];
    renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        order.push("layout");
      }, []);
    });
    expect(order).toEqual(["layout"]);
  });
});
