import { strategySelector, strategySelectorOptional } from "../../../src/shared/strategy-selector";

describe("strategySelector", () => {
  const strategies = {
    add: (x: number) => x + 1,
    double: (x: number) => x * 2,
    id: (x: number) => x,
  };

  it("should run strategy by key", () => {
    const run = strategySelector(strategies);
    expect(run("add", 5)).toBe(6);
    expect(run("double", 5)).toBe(10);
    expect(run("id", 5)).toBe(5);
  });

  it("should use defaultKey when key is missing", () => {
    const run = strategySelector(strategies, { defaultKey: "id" });
    expect((run as (key: string, input: number) => number)("unknown", 5)).toBe(5);
  });

  it("should throw when key unknown and no defaultKey", () => {
    const run = strategySelector(strategies);
    expect(() => (run as (key: string, input: number) => number)("unknown", 5)).toThrow(
      "Unknown strategy"
    );
  });
});

describe("strategySelectorOptional", () => {
  const strategies = {
    a: (x: number) => x + 1,
    b: (x: number) => x * 2,
  };

  it("should return result for known key", () => {
    const run = strategySelectorOptional(strategies);
    expect(run("a", 5)).toBe(6);
  });

  it("should return undefined for unknown key when no default", () => {
    const run = strategySelectorOptional(strategies);
    expect((run as (key: string, input: number) => number | undefined)("c", 5)).toBeUndefined();
  });

  it("should use defaultKey for unknown key", () => {
    const run = strategySelectorOptional(strategies, { defaultKey: "b" });
    expect((run as (key: string, input: number) => number | undefined)("c", 5)).toBe(10);
  });
});
