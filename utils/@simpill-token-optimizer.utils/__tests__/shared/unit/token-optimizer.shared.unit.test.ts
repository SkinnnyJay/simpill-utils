import {
  buildAnalyticsSnapshot,
  CsvCompressionStrategy,
  cleanPrompt,
  createAnalyticsTelemetryStorage,
  createCompositeTelemetryStorage,
  createDefaultTokenizerAdapter,
  createDefaultValidatorRegistry,
  JsonCompressionStrategy,
  MarkdownCompressionStrategy,
  PassthroughStrategy,
  TonlCompressionStrategy,
  ToonCompressionStrategy,
  XmlCompressionStrategy,
  YamlCompressionStrategy,
} from "../../../src/shared";
import { analytics } from "../../../src/shared/stubs/analytics";
import { TokenOptimizer } from "../../../src/shared/tokenOptimizer";
import { CompressionTypeEnum } from "../../../src/shared/types";

const buildSnapshot = () =>
  buildAnalyticsSnapshot({
    before: {
      text: "hello",
      estimate: { tokenCount: 4, charCount: 5, byteSize: 5 },
    },
    after: {
      text: "hi",
      estimate: { tokenCount: 2, charCount: 2, byteSize: 2 },
    },
  });

describe("token-optimizer shared utilities", () => {
  it("cleans prompt using configured transforms", () => {
    const result = cleanPrompt({
      text: "  hello   world \r\n",
      options: { trim: true, collapseWhitespace: true, normalizeNewlines: true },
    });
    expect(["hello world", "hello world\n"]).toContain(result.output);
    expect(result.appliedTransforms.some((t) => t.applied)).toBe(true);
  });

  it("creates a default tokenizer adapter", () => {
    const adapter = createDefaultTokenizerAdapter();
    const estimate = adapter.estimate("hello");
    expect(estimate.tokenCount).toBeGreaterThan(0);
    expect(estimate.charCount).toBe(5);
  });

  it("builds analytics snapshot with sane defaults", () => {
    const snapshot = buildSnapshot();
    expect(snapshot.metricsBefore.rawPromptText).toBe("hello");
    expect(snapshot.savings.tokensSaved).toBeGreaterThanOrEqual(0);
  });

  it("formats JSON and markdown strategies", () => {
    const jsonStrategy = new JsonCompressionStrategy();
    const jsonResult = jsonStrategy.format('{"b":1,"a":2,"c":null}', {
      prompt: "",
      compressionType: CompressionTypeEnum.JSON,
    });
    expect(jsonResult.optimizedText).toBe('{"a":2,"b":1}');

    const markdownStrategy = new MarkdownCompressionStrategy();
    const markdownResult = markdownStrategy.format("# Title\n\n- item", {
      prompt: "",
      compressionType: CompressionTypeEnum.MARKDOWN,
    });
    expect(markdownResult.optimizedText).toContain("# Title");
    expect(markdownResult.optimizedPayload).toBeDefined();
  });

  it("formats YAML, XML, CSV, TONL, TOON strategies", async () => {
    const yamlStrategy = new YamlCompressionStrategy();
    const yamlResult = yamlStrategy.format("a: 1\nb: 2\n", {
      prompt: "",
      compressionType: CompressionTypeEnum.YAML,
    });
    expect(yamlResult.optimizedText).toContain("a: 1");

    const xmlStrategy = new XmlCompressionStrategy();
    const xmlResult = xmlStrategy.format('<root attr="1"><child>text</child></root>', {
      prompt: "",
      compressionType: CompressionTypeEnum.XML,
    });
    expect(xmlResult.optimizedText).toContain("<root");

    const csvStrategy = new CsvCompressionStrategy();
    const csvResult = csvStrategy.format("a,b\n1,2\n", {
      prompt: "",
      compressionType: CompressionTypeEnum.CSV,
    });
    expect(csvResult.optimizedText).toContain("a,b");

    const tonlStrategy = new TonlCompressionStrategy();
    const tonlResult = await tonlStrategy.format('{"a":1}', {
      prompt: "",
      compressionType: CompressionTypeEnum.TONL,
    });
    expect(tonlResult.optimizedText).toContain("{");

    const toonStrategy = new ToonCompressionStrategy();
    const toonResult = await toonStrategy.format('{"a":1}', {
      prompt: "",
      compressionType: CompressionTypeEnum.TOON,
    });
    expect(toonResult.optimizedText).toContain("{");
  });

  it("supports passthrough strategy", () => {
    const passthrough = new PassthroughStrategy(CompressionTypeEnum.JSON);
    const result = passthrough.format("keep", {
      prompt: "",
      compressionType: CompressionTypeEnum.JSON,
    });
    expect(result.optimizedText).toBe("keep");
  });

  it("optimizes prompt end-to-end with validator registry", async () => {
    const telemetryStorage = {
      persistSnapshot: async () => {},
      fetchRecent: async () => [],
      purge: async () => {},
    };
    const strategies = new Map();
    strategies.set(CompressionTypeEnum.JSON, new JsonCompressionStrategy());

    const optimizer = new TokenOptimizer({
      tokenizer: createDefaultTokenizerAdapter(),
      telemetryStorage,
      strategies,
      validatorRegistry: createDefaultValidatorRegistry(),
      strategyVersion: "1.0.0",
    });

    const result = await optimizer.optimize({
      prompt: '{"a":1}',
      compressionType: CompressionTypeEnum.JSON,
    });
    expect(result.optimizedPrompt).toBe('{"a":1}');
    expect(result.metadata.strategyVersion).toBe("1.0.0");
  });

  it("bridges telemetry storage to analytics", async () => {
    const tracked: Array<{ snapshot: unknown; context?: unknown }> = [];
    const analyticsService = {
      trackTokenOptimization: async (snapshot: unknown, context?: unknown) => {
        tracked.push({ snapshot, context });
      },
    };
    const fallbackStorage = createCompositeTelemetryStorage([
      {
        persistSnapshot: async () => {},
        fetchRecent: async () => [],
        purge: async () => {},
      },
    ]);
    const storage = createAnalyticsTelemetryStorage({
      analyticsService,
      fallbackStorage,
      compressionType: "json",
    });
    const snapshot = buildSnapshot();
    await storage.persistSnapshot(snapshot);
    expect(tracked.length).toBe(1);
    await storage.purge();

    const noopStorage = createAnalyticsTelemetryStorage({
      analyticsService: analytics,
    });
    await noopStorage.persistSnapshot(buildSnapshot());
  });
});
