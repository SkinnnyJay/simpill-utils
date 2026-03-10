import type { CompressionStrategy } from "../shared/strategies/base";
import { CsvCompressionStrategy } from "../shared/strategies/csv-strategy";
import { JsonCompressionStrategy } from "../shared/strategies/json-strategy";
import { MarkdownCompressionStrategy } from "../shared/strategies/markdown-strategy";
import { PassthroughStrategy } from "../shared/strategies/passthrough-strategy";
import { TonlCompressionStrategy } from "../shared/strategies/tonl-strategy";
import { ToonCompressionStrategy } from "../shared/strategies/toon-strategy";
import { XmlCompressionStrategy } from "../shared/strategies/xml-strategy";
import { YamlCompressionStrategy } from "../shared/strategies/yaml-strategy";
import type { TelemetryStorage } from "../shared/telemetry.types";
import { type CompressionType, compressionTypeSchema } from "../shared/token-optimizer.types";
import { createDefaultTokenizerAdapter, type TokenizerAdapter } from "../shared/tokenizer";
import { TokenOptimizer } from "../shared/tokenOptimizer";
import { CompressionTypeEnum } from "../shared/types";
import {
  type CompressionValidatorRegistry,
  createDefaultValidatorRegistry,
} from "../shared/validatorRegistry";
import { createTelemetryStorage, type TelemetryFactoryOptions } from "./telemetryFactory";

export interface TokenOptimizerFactoryOptions {
  readonly tokenizer?: TokenizerAdapter;
  readonly telemetryStorage?: TelemetryStorage;
  readonly strategies?: CompressionStrategy[];
  readonly telemetryFactoryOptions?: TelemetryFactoryOptions;
  readonly validatorRegistry?: CompressionValidatorRegistry;
  readonly strategyVersion?: string;
}

const buildDefaultStrategies = (): Map<CompressionType, CompressionStrategy> => {
  const strategyMap = new Map<CompressionType, CompressionStrategy>();

  compressionTypeSchema.options.forEach((type) => {
    strategyMap.set(type, new PassthroughStrategy(type));
  });

  strategyMap.set(CompressionTypeEnum.JSON, new JsonCompressionStrategy());
  strategyMap.set(CompressionTypeEnum.MARKDOWN, new MarkdownCompressionStrategy());
  strategyMap.set(CompressionTypeEnum.XML, new XmlCompressionStrategy());
  strategyMap.set(CompressionTypeEnum.YAML, new YamlCompressionStrategy());
  strategyMap.set(CompressionTypeEnum.CSV, new CsvCompressionStrategy());
  strategyMap.set(CompressionTypeEnum.TONL, new TonlCompressionStrategy());
  strategyMap.set(CompressionTypeEnum.TOON, new ToonCompressionStrategy());

  return strategyMap;
};

const createStrategyMap = (
  strategies: CompressionStrategy[] | undefined,
): Map<CompressionType, CompressionStrategy> => {
  const map = buildDefaultStrategies();

  if (!strategies || strategies.length === 0) {
    return map;
  }

  strategies.forEach((strategy) => {
    map.set(strategy.type, strategy);
  });

  return map;
};

export const createTokenOptimizer = (options?: TokenOptimizerFactoryOptions): TokenOptimizer => {
  const tokenizer = options?.tokenizer ?? createDefaultTokenizerAdapter();
  const telemetryStorage =
    options?.telemetryStorage ?? createTelemetryStorage(options?.telemetryFactoryOptions);
  const strategies = createStrategyMap(options?.strategies);
  const validatorRegistry = options?.validatorRegistry ?? createDefaultValidatorRegistry();

  return new TokenOptimizer({
    tokenizer,
    telemetryStorage,
    strategies,
    validatorRegistry,
    strategyVersion: options?.strategyVersion,
  });
};
