/**
 * @file useDeferredUpdate setter stability + isPending tests
 * (fix vs frozen 942f998 per-render setter allocation).
 */

import { act, renderHook } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { useDeferredUpdate } from "../../../src/client/use-deferred-update";

describe("useDeferredUpdate stability", () => {
  it("setter identity is stable across renders (frozen allocated a new fn every render)", () => {
    const setters: unknown[] = [];
    const { result, rerender } = renderHook(() => {
      const [s, set] = useDeferredUpdate(0);
      setters.push(set);
      return [s, set] as const;
    });
    act(() => result.current[1](1));
    rerender();
    expect(new Set(setters).size).toBe(1);
  });

  it("effects depending on the setter do not re-run every render", () => {
    let effectRuns = 0;
    const { result, rerender } = renderHook(() => {
      const [s, set] = useDeferredUpdate(0);
      const runs = useRef(0);
      // biome-ignore lint/correctness/useExhaustiveDependencies: set is the subject under test — stability means this runs once
      useEffect(() => {
        effectRuns += 1;
        runs.current += 1;
      }, [set]);
      return [s, set] as const;
    });
    act(() => result.current[1](1));
    act(() => result.current[1](2));
    rerender();
    expect(effectRuns).toBe(1);
  });

  it("exposes isPending as a boolean third element (back-compat destructure intact)", () => {
    const { result } = renderHook(() => useDeferredUpdate("a"));
    expect(typeof result.current[2]).toBe("boolean");
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");
    expect(result.current[2]).toBe(false); // settled after act flush
  });

  it("functional updates still work through the transition", () => {
    const { result } = renderHook(() => useDeferredUpdate(10));
    act(() => result.current[1]((n) => n + 5));
    expect(result.current[0]).toBe(15);
  });
});
