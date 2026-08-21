/**
 * The encode paths cannot run in this repo - @toon-format/toon and tonl are optional
 * and not installed - so they are exercised against virtual module mocks. Without
 * this the strategies' happy paths have no coverage at all.
 */
import type { OptimizationRequest } from "../../../src/shared/token-optimizer.types";

const request = {} as OptimizationRequest;

jest.mock(
  "@toon-format/toon",
  () => ({
    encode: (value: unknown): string => `toon:${JSON.stringify(value)}\nsecond-line`,
  }),
  { virtual: true },
);

jest.mock(
  "tonl",
  () => ({
    encodeSmart: (value: unknown): string => `tonl:${JSON.stringify(value)}`,
  }),
  { virtual: true },
);

describe("TOON strategy with the encoder present", () => {
  it("returns the encoder's output and counts lines, keys and arrays", async () => {
    const { ToonCompressionStrategy } = await import(
      "../../../src/shared/strategies/toon-strategy"
    );

    const result = await new ToonCompressionStrategy().format(
      JSON.stringify({ a: 1, b: [1, 2], c: { d: 3 } }),
      request,
    );

    expect(result.optimizedText).toContain("toon:");
    expect(result.optimizedText).toContain("second-line");
    // 3 top-level keys + 1 nested key
    expect(result.optimizedPayload).toMatchObject({
      lineCount: 2,
      objectKeyCount: 4,
      arrayCount: 1,
    });
  });

  it("counts zero lines for empty encoder output", async () => {
    jest.resetModules();
    jest.doMock("@toon-format/toon", () => ({ encode: (): string => "   " }), { virtual: true });
    const { ToonCompressionStrategy } = await import(
      "../../../src/shared/strategies/toon-strategy"
    );

    const result = await new ToonCompressionStrategy().format(JSON.stringify({ a: 1 }), request);

    expect(result.optimizedText).toBe("");
    expect(result.optimizedPayload).toMatchObject({ lineCount: 0 });
  });

  it("walks nested arrays and null values without miscounting", async () => {
    jest.resetModules();
    jest.doMock("@toon-format/toon", () => ({ encode: (): string => "x" }), { virtual: true });
    const { ToonCompressionStrategy } = await import(
      "../../../src/shared/strategies/toon-strategy"
    );

    const result = await new ToonCompressionStrategy().format(
      JSON.stringify({ a: [[1], null], b: null }),
      request,
    );

    expect(result.optimizedPayload).toMatchObject({ objectKeyCount: 2, arrayCount: 2 });
  });
});

describe("TONL strategy with the encoder present", () => {
  it("uses encodeSmart when the module provides it", async () => {
    const { TonlCompressionStrategy } = await import(
      "../../../src/shared/strategies/tonl-strategy"
    );

    const result = await new TonlCompressionStrategy().format(JSON.stringify({ a: 1 }), request);

    expect(result.optimizedText).toContain("tonl:");
  });

  it("falls back to encodeTONL when encodeSmart is absent", async () => {
    jest.resetModules();
    jest.doMock("tonl", () => ({ encodeTONL: (): string => "from-encodeTONL" }), {
      virtual: true,
    });
    const { TonlCompressionStrategy } = await import(
      "../../../src/shared/strategies/tonl-strategy"
    );

    const result = await new TonlCompressionStrategy().format(JSON.stringify({ a: 1 }), request);

    expect(result.optimizedText).toContain("from-encodeTONL");
  });
});
