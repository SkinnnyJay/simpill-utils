/**
 * @file useStableCallback unit tests
 */

import { renderHook } from "@testing-library/react";
import { useStableCallback } from "../../../src/client/use-stable-callback";

describe("useStableCallback", () => {
  it("returns a function that invokes the latest callback", () => {
    const fn = jest.fn((...args: unknown[]) => (args[0] as number) + 1);
    const { result, rerender } = renderHook(({ cb }) => useStableCallback(cb), {
      initialProps: { cb: fn },
    });
    const stable = result.current;
    expect(stable(1)).toBe(2);
    expect(fn).toHaveBeenCalledWith(1);

    const fn2 = jest.fn((...args: unknown[]) => (args[0] as number) + 10);
    rerender({ cb: fn2 });
    expect(result.current).toBe(stable);
    expect(stable(1)).toBe(11);
    expect(fn2).toHaveBeenCalledWith(1);
  });
});
