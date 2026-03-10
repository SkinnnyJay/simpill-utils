/**
 * @file useDeferredUpdate unit tests
 */

import { act, renderHook } from "@testing-library/react";
import { useDeferredUpdate } from "../../../src/client/use-deferred-update";

describe("useDeferredUpdate", () => {
  it("returns initial value and setter", () => {
    const { result } = renderHook(() => useDeferredUpdate(0));
    expect(result.current[0]).toBe(0);
    expect(typeof result.current[1]).toBe("function");
  });

  it("updates state when setter is called", () => {
    const { result } = renderHook(() => useDeferredUpdate(0));
    act(() => result.current[1](1));
    expect(result.current[0]).toBe(1);
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(2);
  });
});
