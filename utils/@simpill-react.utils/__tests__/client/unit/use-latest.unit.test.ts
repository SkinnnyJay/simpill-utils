/**
 * @file useLatest unit tests
 */

import { renderHook } from "@testing-library/react";
import { useLatest } from "../../../src/client/use-latest";

describe("useLatest", () => {
  it("returns a ref with the initial value", () => {
    const { result } = renderHook(() => useLatest(42));
    expect(result.current.current).toBe(42);
  });

  it("updates ref when value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 1 },
    });
    expect(result.current.current).toBe(1);
    rerender({ value: 2 });
    expect(result.current.current).toBe(2);
  });

  it("keeps same ref identity across rerenders", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: "a" },
    });
    const refA = result.current;
    rerender({ value: "b" });
    expect(result.current).toBe(refA);
    expect(result.current.current).toBe("b");
  });
});
