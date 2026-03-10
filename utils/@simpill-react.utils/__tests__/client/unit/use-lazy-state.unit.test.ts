/**
 * @file useLazyState unit tests
 */

import { act, renderHook } from "@testing-library/react";
import { useLazyState } from "../../../src/client/use-lazy-state";

describe("useLazyState", () => {
  it("uses initializer for initial state", () => {
    const initializer = jest.fn(() => 10);
    const { result } = renderHook(() => useLazyState(initializer));
    expect(result.current[0]).toBe(10);
    expect(initializer).toHaveBeenCalledTimes(1);
  });

  it("does not re-run initializer on rerender", () => {
    const initializer = jest.fn(() => 0);
    const { rerender } = renderHook(() => useLazyState(initializer));
    rerender();
    rerender();
    expect(initializer).toHaveBeenCalledTimes(1);
  });

  it("updates state when setState is called", () => {
    const { result } = renderHook(() => useLazyState(() => 0));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(6);
  });
});
