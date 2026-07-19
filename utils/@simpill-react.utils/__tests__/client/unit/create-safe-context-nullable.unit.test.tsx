/**
 * @file createSafeContext nullable-value + useMaybeCtx tests
 * (fix vs frozen 942f998 null-sentinel collision).
 */

import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { createSafeContext } from "../../../src/client/create-safe-context";

const muted = (fn: () => void) => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
};

describe("createSafeContext with nullable values", () => {
  it("accepts a legitimate null value inside the Provider (frozen THREW)", () => {
    const { Provider, useCtx } = createSafeContext<string | null>("Nullable");
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(Provider, { value: null, children });
    const { result } = renderHook(() => useCtx(), { wrapper });
    expect(result.current).toBeNull();
  });

  it("accepts a legitimate undefined value inside the Provider", () => {
    const { Provider, useCtx } = createSafeContext<number | undefined>("MaybeNum");
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(Provider, { value: undefined, children });
    const { result } = renderHook(() => useCtx(), { wrapper });
    expect(result.current).toBeUndefined();
  });

  it("still throws the byte-identical error outside the Provider", () => {
    const { useCtx } = createSafeContext<string | null>("Nullable");
    muted(() => {
      expect(() => renderHook(() => useCtx())).toThrow(
        "[Nullable] useCtx must be used within the corresponding Provider."
      );
    });
  });

  it("useMaybeCtx returns undefined outside and the value inside", () => {
    const { Provider, useMaybeCtx } = createSafeContext<{ id: number }>("Opt");
    const outside = renderHook(() => useMaybeCtx());
    expect(outside.result.current).toBeUndefined();

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(Provider, { value: { id: 3 }, children });
    const inside = renderHook(() => useMaybeCtx(), { wrapper });
    expect(inside.result.current).toEqual({ id: 3 });
  });
});
