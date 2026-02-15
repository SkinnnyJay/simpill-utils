/**
 * @file createSafeContext and useSafeContext unit tests
 */

import { renderHook } from "@testing-library/react";
import { createContext, createElement, type ReactNode } from "react";
import { createSafeContext, useSafeContext } from "../../../src/client/create-safe-context";

const expectThrowOutsideProvider = (fn: () => void) => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(fn).toThrow(/must be used within/);
  } finally {
    spy.mockRestore();
  }
};

describe("createSafeContext", () => {
  it("useCtx returns value when inside Provider", () => {
    const { Provider, useCtx } = createSafeContext<{ count: number }>();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(Provider, { value: { count: 1 }, children }, children);
    const { result } = renderHook(() => useCtx(), { wrapper });
    expect(result.current).toEqual({ count: 1 });
  });

  it("useCtx throws when outside Provider", () => {
    const { useCtx } = createSafeContext<string>();
    expectThrowOutsideProvider(() => renderHook(() => useCtx()));
  });

  it("useCtx uses custom display name in error", () => {
    const { useCtx } = createSafeContext<number>("MyContext");
    expectThrowOutsideProvider(() => renderHook(() => useCtx()));
  });
});

describe("useSafeContext", () => {
  it("returns value when context has default value", () => {
    const Ctx = createContext<number | null>(42);
    const { result } = renderHook(() => useSafeContext(Ctx));
    expect(result.current).toBe(42);
  });

  it("throws when context is null", () => {
    const Ctx = createContext<number | null>(null);
    expectThrowOutsideProvider(() => renderHook(() => useSafeContext(Ctx)));
  });
});
