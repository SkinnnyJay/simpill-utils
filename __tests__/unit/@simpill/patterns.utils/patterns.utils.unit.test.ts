import { describe, expect, it } from "vitest";
import * as Patterns from "@simpill/patterns.utils";

describe("@simpill/patterns.utils", () => {
  it("resolves and exports pattern utilities", () => {
    expect(Patterns).toBeDefined();
    expect(typeof Patterns).toBe("object");
    const keys = Object.keys(Patterns).filter((k) => (Patterns as Record<string, unknown>)[k] != null);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("pipeAsync composes async steps when present", async () => {
    const P = Patterns as Record<string, unknown>;
    const pipeAsync = P.pipeAsync;
    if (typeof pipeAsync !== "function") return;
    const addOne = async (n: number) => n + 1;
    const double = async (n: number) => n * 2;
    let result: number;
    try {
      result = await (pipeAsync as (v: number, ...fns: Array<(n: number) => Promise<number>>) => Promise<number>)(
        1,
        addOne,
        double,
      );
    } catch {
      const composed = (pipeAsync as (fns: Array<(n: number) => Promise<number>>) => (x: number) => Promise<number>)(
        [addOne, double],
      );
      result = await composed(1);
    }
    expect(typeof result).toBe("number");
    expect(result).toBe(4);
  });
});
