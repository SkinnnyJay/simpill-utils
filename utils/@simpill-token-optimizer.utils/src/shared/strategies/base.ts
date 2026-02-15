import type { OptimizationRequest } from "../token-optimizer.types";

export interface CompressionOutcome {
  optimizedText: string;
  optimizedPayload?: unknown;
}

export interface CompressionStrategy {
  readonly type: OptimizationRequest["compressionType"];
  format(
    cleanedInput: string,
    request: OptimizationRequest,
  ): Promise<CompressionOutcome> | CompressionOutcome;
}
