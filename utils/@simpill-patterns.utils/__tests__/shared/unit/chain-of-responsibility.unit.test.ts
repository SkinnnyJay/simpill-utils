import {
  chainOfResponsibility,
  handled,
  unhandled,
} from "../../../src/shared/chain-of-responsibility";

describe("chainOfResponsibility", () => {
  it("returns first handled result", () => {
    const run = chainOfResponsibility([
      (input: number) => (input > 10 ? handled("big") : unhandled()),
      (input: number) => handled(`value:${input}`),
    ]);

    expect(run(5)).toBe("value:5");
    expect(run(11)).toBe("big");
  });

  it("uses fallback when no handler handles", () => {
    const run = chainOfResponsibility(
      [(input: number) => (input > 0 ? unhandled() : handled("neg"))],
      { fallback: () => "fallback" }
    );

    expect(run(1)).toBe("fallback");
  });

  it("throws when unhandled and no fallback", () => {
    const run = chainOfResponsibility([(_input: number) => unhandled()]);
    expect(() => run(1)).toThrow("No handler handled the input.");
  });

  it("uses custom error message", () => {
    const run = chainOfResponsibility([(_input: string) => unhandled()], {
      errorMessage: (input) => `Unhandled: ${input}`,
    });

    expect(() => run("x")).toThrow("Unhandled: x");
  });
});
