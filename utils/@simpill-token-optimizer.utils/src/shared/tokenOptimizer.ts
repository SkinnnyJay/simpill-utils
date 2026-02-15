import { buildAnalyticsSnapshot } from "./analytics";
import { cleanPrompt } from "./cleaner";
import { ERROR_MESSAGES, LIMIT } from "./constants";
import { createScopedLogger } from "./logger";
import type { CompressionStrategy } from "./strategies/base";
import { PassthroughStrategy } from "./strategies/passthrough-strategy";
import type { TelemetryStorage } from "./telemetry.types";
import {
  type OptimizationMetadata,
  type OptimizationRequest,
  type OptimizationResult,
  optimizationRequestSchema,
} from "./token-optimizer.types";
import type { TokenizerAdapter } from "./tokenizer";
import type { CompressionValidatorRegistry } from "./validatorRegistry";

const logger = createScopedLogger("TokenOptimizer");

export interface TokenOptimizerDependencies {
  readonly tokenizer: TokenizerAdapter;
  readonly telemetryStorage: TelemetryStorage;
  readonly strategies: Map<OptimizationRequest["compressionType"], CompressionStrategy>;
  readonly validatorRegistry: CompressionValidatorRegistry;
  readonly strategyVersion?: string;
}

export class TokenOptimizer {
  private readonly tokenizer: TokenizerAdapter;
  private readonly telemetryStorage: TelemetryStorage;
  private readonly strategies: Map<OptimizationRequest["compressionType"], CompressionStrategy>;
  private readonly validatorRegistry: CompressionValidatorRegistry;
  private readonly strategyVersion: string;

  public constructor(dependencies: TokenOptimizerDependencies) {
    this.tokenizer = dependencies.tokenizer;
    this.telemetryStorage = dependencies.telemetryStorage;
    this.strategies = dependencies.strategies;
    this.validatorRegistry = dependencies.validatorRegistry;
    this.strategyVersion = dependencies.strategyVersion ?? "0.1.0";
  }

  public async optimize(rawRequest: OptimizationRequest): Promise<OptimizationResult> {
    const request = optimizationRequestSchema.parse(rawRequest);
    const beforeEstimate = this.tokenizer.estimate(request.prompt);

    const cleanResult = cleanPrompt({
      text: request.prompt,
      options: request.cleanOptions,
    });

    const strategy = this.strategies.get(request.compressionType);

    if (!strategy) {
      throw new Error(ERROR_MESSAGES.UNSUPPORTED_COMPRESSION_TYPE_PREFIX + request.compressionType);
    }

    let formatted: Awaited<ReturnType<CompressionStrategy["format"]>>;
    let usedFallback = false;
    try {
      formatted = await Promise.resolve(strategy.format(cleanResult.output, request));

      if (formatted.optimizedText === cleanResult.output) {
        logger.warn("Strategy returned unchanged content", {
          compressionType: request.compressionType,
          strategyType: strategy.type,
        });
      }
    } catch (error) {
      logger.warn("Strategy failed, falling back to passthrough", {
        compressionType: request.compressionType,
        strategyType: strategy.type,
        error: error instanceof Error ? error.message : String(error),
      });
      const fallbackStrategy = new PassthroughStrategy(request.compressionType);
      formatted = await Promise.resolve(fallbackStrategy.format(cleanResult.output, request));
      usedFallback = true;
    }

    const afterEstimate = this.tokenizer.estimate(formatted.optimizedText);

    const beforeSize = new TextEncoder().encode(request.prompt).length;
    const afterSize = new TextEncoder().encode(formatted.optimizedText).length;
    const sizeReduction = beforeSize - afterSize;
    const sizeReductionPercent =
      beforeSize > 0 ? ((sizeReduction / beforeSize) * LIMIT.PERCENT_SCALE).toFixed(2) : "0.00";
    const tokenReduction = beforeEstimate.tokenCount - afterEstimate.tokenCount;
    const tokenReductionPercent =
      beforeEstimate.tokenCount > 0
        ? ((tokenReduction / beforeEstimate.tokenCount) * LIMIT.PERCENT_SCALE).toFixed(2)
        : "0.00";

    logger.debug("Token optimization completed", {
      compressionType: request.compressionType,
      strategyType: strategy.type,
      usedFallback,
      before: {
        chars: request.prompt.length,
        bytes: beforeSize,
        tokens: beforeEstimate.tokenCount,
      },
      after: {
        chars: formatted.optimizedText.length,
        bytes: afterSize,
        tokens: afterEstimate.tokenCount,
      },
      reduction: {
        bytes: sizeReduction,
        bytesPercent: `${sizeReductionPercent}%`,
        tokens: tokenReduction,
        tokensPercent: `${tokenReductionPercent}%`,
      },
    });

    if (afterEstimate.tokenCount >= beforeEstimate.tokenCount) {
      logger.warn("Token optimization did not reduce token count", {
        compressionType: request.compressionType,
        tokensBefore: beforeEstimate.tokenCount,
        tokensAfter: afterEstimate.tokenCount,
        usedFallback,
        strategyType: strategy.type,
      });
    }

    const analytics = buildAnalyticsSnapshot({
      before: {
        text: request.prompt,
        estimate: beforeEstimate,
      },
      after: {
        text: formatted.optimizedText,
        estimate: afterEstimate,
      },
    });

    const metadata: OptimizationMetadata = this.validatorRegistry.validateMetadata({
      compressionType: request.compressionType,
      strategyVersion: this.strategyVersion,
      appliedCleaners: cleanResult.appliedTransforms
        .filter((transform) => transform.applied)
        .map((transform) => transform.name),
    });

    const validatedPayload = this.validatorRegistry.validatePayload(
      request.compressionType,
      formatted.optimizedPayload,
    );

    const result: OptimizationResult = {
      optimizedPrompt: formatted.optimizedText,
      optimizedPayload: validatedPayload,
      analytics,
      metadata,
    };

    await this.telemetryStorage.persistSnapshot(analytics);

    return result;
  }
}
