/** Benchmark: frozen 942f998 vs lumen-uplift/react. Not part of the shipped suite. */
import { act } from "@testing-library/react";
import { createElement, useEffect, useInsertionEffect, useRef, type RefObject } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useLatest as upliftUseLatest } from "../src/client/use-latest";

// Frozen useLatest (verbatim from 942f998)
function frozenUseLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref as RefObject<T>;
}

const HOOKS = 20;
const RERENDERS = 5000;

function bench(label: string, useHook: (v: number) => unknown): number {
  function Comp({ v }: { v: number }) {
    for (let i = 0; i < HOOKS; i++) useHook(v + i);
    return null;
  }
  const el = document.createElement("div");
  const root = createRoot(el);
  act(() => { flushSync(() => root.render(createElement(Comp, { v: 0 }))); });
  const t0 = performance.now();
  act(() => {
    for (let i = 1; i <= RERENDERS; i++) {
      flushSync(() => root.render(createElement(Comp, { v: i })));
    }
  });
  const ms = performance.now() - t0;
  act(() => root.unmount());
  console.log(`${label}: ${ms.toFixed(1)}ms for ${RERENDERS} rerenders x ${HOOKS} hooks`);
  return ms;
}

describe("bench", () => {
  it("useLatest rerender throughput", () => {
    // warmup
    bench("warmup-frozen", frozenUseLatest);
    bench("warmup-uplift", upliftUseLatest);
    const runs: Array<[number, number]> = [];
    for (let r = 0; r < 3; r++) {
      const f = bench(`frozen  r${r}`, frozenUseLatest);
      const u = bench(`uplift  r${r}`, upliftUseLatest);
      runs.push([f, u]);
    }
    const med = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    const fm = med(runs.map((x) => x[0]));
    const um = med(runs.map((x) => x[1]));
    console.log(`MEDIAN frozen=${fm.toFixed(1)}ms uplift=${um.toFixed(1)}ms ratio=${(fm / um).toFixed(2)}x`);
    expect(true).toBe(true);
  }, 300000);
});
