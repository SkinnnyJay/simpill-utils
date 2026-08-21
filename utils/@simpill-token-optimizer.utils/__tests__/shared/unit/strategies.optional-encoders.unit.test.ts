/**
 * The TOON and TONL encoders are optional dependencies that are not installed here.
 * Both strategies used to fall back to JSON and report success, which made a TOON
 * request *expand* the prompt while claiming compression; they now fail loudly so
 * the optimizer can substitute passthrough. These cover both halves of that.
 */
import { ERROR_MESSAGES } from "../../../src/shared/constants";
import type { OptimizationRequest } from "../../../src/shared/token-optimizer.types";

const request = {} as OptimizationRequest;

describe("TOON strategy without the optional encoder", () => {
  it("rejects input that is not JSON before it ever reaches the encoder", async () => {
    const { ToonCompressionStrategy } = await import(
      "../../../src/shared/strategies/toon-strategy"
    );

    await expect(new ToonCompressionStrategy().format("not json", request)).rejects.toThrow(
      ERROR_MESSAGES.TOON_INVALID_JSON,
    );
  });

  it("fails loudly instead of silently returning JSON", async () => {
    const { ToonCompressionStrategy } = await import(
      "../../../src/shared/strategies/toon-strategy"
    );

    await expect(
      new ToonCompressionStrategy().format(JSON.stringify({ a: 1 }), request),
    ).rejects.toThrow(ERROR_MESSAGES.TOON_ENCODER_UNAVAILABLE);
  });
});

describe("TONL strategy without the optional encoder", () => {
  it("rejects input that is not JSON before it ever reaches the encoder", async () => {
    const { TonlCompressionStrategy } = await import(
      "../../../src/shared/strategies/tonl-strategy"
    );

    await expect(new TonlCompressionStrategy().format("not json", request)).rejects.toThrow(
      ERROR_MESSAGES.TONL_INVALID_JSON,
    );
  });

  it("fails loudly instead of silently returning JSON", async () => {
    const { TonlCompressionStrategy } = await import(
      "../../../src/shared/strategies/tonl-strategy"
    );

    await expect(
      new TonlCompressionStrategy().format(JSON.stringify({ a: 1 }), request),
    ).rejects.toThrow(ERROR_MESSAGES.TONL_ENCODER_UNAVAILABLE);
  });
});
