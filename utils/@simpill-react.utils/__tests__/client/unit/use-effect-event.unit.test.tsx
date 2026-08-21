/**
 * @file useEffectEvent ponyfill tests (React 19.2 semantics on React 18).
 */

import { act, renderHook } from "@testing-library/react";
import { useEffect, useState } from "react";
import { ERROR_EFFECT_EVENT_RENDER } from "../../../src/client/constants";
import { useEffectEvent } from "../../../src/client/use-effect-event";

describe("useEffectEvent", () => {
  it("always sees the latest state without re-running the effect", () => {
    const effectRuns: number[] = [];
    const observed: number[] = [];
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const onTick = useEffectEvent(() => observed.push(count));
      // biome-ignore lint/correctness/useExhaustiveDependencies: onTick deliberately omitted — Effect Events are never dependencies
      useEffect(() => {
        effectRuns.push(1);
        const id = setInterval(onTick, 100);
        return () => clearInterval(id);
      }, []);
      return { setCount };
    });

    jest.useFakeTimers();
    try {
      act(() => result.current.setCount(5));
      // Re-render happened, effect must NOT have re-run:
      expect(effectRuns).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("reads latest value when invoked from a re-armed effect", () => {
    const observed: number[] = [];
    const { result } = renderHook(() => {
      const [count, setCount] = useState(1);
      const read = useEffectEvent(() => observed.push(count));
      useEffect(() => {
        read();
      });
      return { setCount };
    });
    act(() => result.current.setCount(2));
    act(() => result.current.setCount(3));
    expect(observed).toEqual([1, 2, 3]);
  });

  it("preserves parameter and return types", () => {
    const { result } = renderHook(() => useEffectEvent((a: number, b: number) => a * b));
    let out = 0;
    act(() => {
      out = result.current(6, 7);
    });
    expect(out).toBe(42);
  });

  it("throws when called during the initial render (React semantics)", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        renderHook(() => {
          const ev = useEffectEvent(() => 1);
          ev(); // illegal: render phase
        })
      ).toThrow(ERROR_EFFECT_EVENT_RENDER);
    } finally {
      spy.mockRestore();
    }
  });
});
