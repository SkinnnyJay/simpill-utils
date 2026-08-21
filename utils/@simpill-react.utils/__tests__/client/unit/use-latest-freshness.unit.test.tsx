/**
 * @file useLatest same-commit freshness tests (fix vs frozen 942f998, which
 * synced in useEffect and returned the PREVIOUS value to layout effects).
 */

import { renderHook } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { useLatest } from "../../../src/client/use-latest";

describe("useLatest freshness", () => {
  it("layout effects of the same commit read the NEW value", () => {
    const seen: number[] = [];
    const { rerender } = renderHook(
      ({ v }) => {
        const ref = useLatest(v);
        // biome-ignore lint/correctness/useExhaustiveDependencies: v deliberately re-arms the layout effect each commit
        useLayoutEffect(() => {
          seen.push(ref.current);
        }, [v, ref]);
      },
      { initialProps: { v: 1 } }
    );
    rerender({ v: 2 });
    rerender({ v: 3 });
    // Frozen implementation produced [1, 1, 2] (always one commit behind).
    expect(seen).toEqual([1, 2, 3]);
  });

  it("current is typed non-null (no bogus null checks)", () => {
    const { result } = renderHook(() => useLatest({ n: 7 }));
    // Compile-level assertion: with the frozen RefObject<T> return type this
    // line was a TS2531/TS18047 error ('possibly null').
    const n: number = result.current.current.n;
    expect(n).toBe(7);
  });

  it("holds latest value for async reads (timer pattern)", () => {
    jest.useFakeTimers();
    try {
      let observed = -1;
      const { result, rerender } = renderHook(({ v }) => useLatest(v), {
        initialProps: { v: 10 },
      });
      setTimeout(() => {
        observed = result.current.current;
      }, 50);
      rerender({ v: 20 });
      jest.advanceTimersByTime(50);
      expect(observed).toBe(20);
    } finally {
      jest.useRealTimers();
    }
  });
});
