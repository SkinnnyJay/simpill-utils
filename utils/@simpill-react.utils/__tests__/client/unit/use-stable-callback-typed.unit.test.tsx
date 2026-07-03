/**
 * @file useStableCallback typed-args / this / freshness tests
 * (fix vs frozen 942f998).
 */

import { renderHook } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { useStableCallback } from "../../../src/client/use-stable-callback";

describe("useStableCallback typing and semantics", () => {
  it("accepts callbacks with typed parameters (frozen generic was TS2345)", () => {
    // Frozen: `T extends (...args: unknown[]) => unknown` rejected
    // `(x: number, y: string) => number` — parameters are contravariant.
    const { result } = renderHook(() => useStableCallback((x: number, y: string) => x + y.length));
    const out: number = result.current(40, "ab");
    expect(out).toBe(42);
  });

  it("forwards `this` (frozen arrow wrapper dropped it)", () => {
    const { result } = renderHook(() =>
      useStableCallback(function (this: { base: number }, add: number) {
        return this.base + add;
      })
    );
    const host = { base: 100, fn: result.current };
    expect(host.fn.call({ base: 100 }, 1)).toBe(101);
  });

  it("layout effect in the same commit invokes the NEW callback", () => {
    const seen: string[] = [];
    const { rerender } = renderHook(
      ({ tag }) => {
        const cb = useStableCallback(() => seen.push(tag));
        // biome-ignore lint/correctness/useExhaustiveDependencies: tag deliberately re-arms the layout effect each commit
        useLayoutEffect(() => {
          cb();
        }, [tag, cb]);
      },
      { initialProps: { tag: "a" } }
    );
    rerender({ tag: "b" });
    // Frozen implementation produced ["a", "a"].
    expect(seen).toEqual(["a", "b"]);
  });

  it("identity is stable across rerenders (unchanged contract)", () => {
    const { result, rerender } = renderHook(({ cb }) => useStableCallback(cb), {
      initialProps: { cb: (n: number) => n + 1 },
    });
    const first = result.current;
    rerender({ cb: (n: number) => n + 10 });
    expect(result.current).toBe(first);
    expect(first(1)).toBe(11);
  });
});
