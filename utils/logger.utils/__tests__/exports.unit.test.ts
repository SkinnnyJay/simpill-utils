/**
 * @file Exports Unit Tests
 * @description Tests to verify all exports are accessible from entry points
 */

describe("Main exports (src/index.ts)", () => {
  it("should export all shared utilities", async () => {
    const exports = await import("../src/index");

    // Adapter interface
    expect(exports.isLoggerAdapter).toBeDefined();

    // Constants
    expect(exports.LOG_LEVEL).toBeDefined();
    expect(exports.LOG_LEVEL_LOWER).toBeDefined();
    expect(exports.LOGGER_CONTEXT).toBeDefined();
    expect(exports.LOGGER_DEFAULTS).toBeDefined();
    expect(exports.METADATA_KEYS).toBeDefined();

    // Factory
    expect(exports.LoggerFactory).toBeDefined();
    expect(exports.LoggerFactory.getLogger).toBeDefined();
    expect(exports.LoggerFactory.clearCache).toBeDefined();
    expect(exports.LoggerFactory.getCacheSize).toBeDefined();
    expect(exports.getLogger).toBeDefined();
    expect(exports.configureLogger).toBeDefined();

    // Simple adapter
    expect(exports.SimpleLoggerAdapter).toBeDefined();
    expect(exports.createSimpleAdapter).toBeDefined();

    // Types utility
    expect(exports.LOG_LEVEL_PRIORITY).toBeDefined();
    expect(exports.shouldLog).toBeDefined();

    // Formatters
    expect(exports.simpleFormatter).toBeDefined();
    expect(exports.jsonFormatter).toBeDefined();
    expect(exports.timestampFormatter).toBeDefined();
    expect(exports.createFormatter).toBeDefined();
    expect(exports.serializeMetadata).toBeDefined();
  });

  it("should export all server utilities", async () => {
    const exports = await import("../src/index");

    // Logger
    expect(exports.createClassLogger).toBeDefined();
    expect(exports.enableMockLogger).toBeDefined();
    expect(exports.disableMockLogger).toBeDefined();
    expect(exports.isMockLoggerActive).toBeDefined();
    expect(exports.LoggerSingleton).toBeDefined();
    expect(exports.LoggerInstance).toBeDefined();
    expect(exports.LogInstance).toBeDefined();
    expect(exports.logTable).toBeDefined();
    expect(exports.logExecutorEvent).toBeDefined();
    expect(exports.logLLMEvent).toBeDefined();
  });

  it("should export all client utilities", async () => {
    const exports = await import("../src/index");

    expect(exports.createEdgeLogger).toBeDefined();
    expect(exports.enableEdgeMockLogger).toBeDefined();
    expect(exports.disableEdgeMockLogger).toBeDefined();
    expect(exports.isEdgeMockLoggerActive).toBeDefined();
    expect(exports.EdgeLogger).toBeDefined();
    expect(exports.EdgeLogInstance).toBeDefined();
    expect(exports.edgeLogInfo).toBeDefined();
    expect(exports.edgeLogWarn).toBeDefined();
    expect(exports.edgeLogDebug).toBeDefined();
    expect(exports.edgeLogError).toBeDefined();
  });
});

describe("Server exports (src/server/index.ts)", () => {
  it("should export all server utilities", async () => {
    const exports = await import("../src/server/index");

    // Logger
    expect(exports.createClassLogger).toBeDefined();
    expect(exports.enableMockLogger).toBeDefined();
    expect(exports.disableMockLogger).toBeDefined();
    expect(exports.isMockLoggerActive).toBeDefined();
    expect(exports.LoggerSingleton).toBeDefined();
    expect(exports.LoggerInstance).toBeDefined();
    expect(exports.LogInstance).toBeDefined();
    expect(exports.logTable).toBeDefined();
    expect(exports.logExecutorEvent).toBeDefined();
    expect(exports.logLLMEvent).toBeDefined();
  });
});

describe("Adapters exports (src/adapters/index.ts)", () => {
  it("should export Pino adapter", async () => {
    const exports = await import("../src/adapters/index");

    expect(exports.PinoLoggerAdapter).toBeDefined();
    expect(exports.createPinoAdapter).toBeDefined();
  });

  it("should export File adapter", async () => {
    const exports = await import("../src/adapters/index");

    expect(exports.FileLoggerAdapter).toBeDefined();
    expect(exports.createFileAdapter).toBeDefined();
  });

  it("should export Multi-transport adapter", async () => {
    const exports = await import("../src/adapters/index");

    expect(exports.MultiTransportAdapter).toBeDefined();
    expect(exports.createMultiAdapter).toBeDefined();
  });
});

describe("Client exports (src/client/index.ts)", () => {
  it("should export all client utilities", async () => {
    const exports = await import("../src/client/index");

    expect(exports.createEdgeLogger).toBeDefined();
    expect(exports.enableEdgeMockLogger).toBeDefined();
    expect(exports.disableEdgeMockLogger).toBeDefined();
    expect(exports.isEdgeMockLoggerActive).toBeDefined();
    expect(exports.EdgeLogger).toBeDefined();
    expect(exports.EdgeLogInstance).toBeDefined();
    expect(exports.edgeLogInfo).toBeDefined();
    expect(exports.edgeLogWarn).toBeDefined();
    expect(exports.edgeLogDebug).toBeDefined();
    expect(exports.edgeLogError).toBeDefined();
  });
});

describe("Shared exports (src/shared/index.ts)", () => {
  it("should export all shared utilities", async () => {
    const exports = await import("../src/shared/index");

    // Adapter interface
    expect(exports.isLoggerAdapter).toBeDefined();

    // Formatter adapter interface
    expect(exports.isFormatterAdapter).toBeDefined();
    expect(exports.createFormatterContext).toBeDefined();
    expect(exports.formatWithAdapter).toBeDefined();
    expect(exports.outputToString).toBeDefined();

    // Simple formatter adapter
    expect(exports.SimpleFormatterAdapter).toBeDefined();
    expect(exports.createSimpleFormatter).toBeDefined();
    expect(exports.defaultFormatter).toBeDefined();
    expect(exports.minimalFormatter).toBeDefined();
    expect(exports.verboseFormatter).toBeDefined();

    // Colored formatter adapter
    expect(exports.ColoredFormatterAdapter).toBeDefined();
    expect(exports.createColoredFormatter).toBeDefined();
    expect(exports.coloredFormatter).toBeDefined();
    expect(exports.COLORS).toBeDefined();

    // Constants
    expect(exports.LOG_LEVEL).toBeDefined();
    expect(exports.LOG_LEVEL_LOWER).toBeDefined();
    expect(exports.LOGGER_CONTEXT).toBeDefined();
    expect(exports.LOGGER_DEFAULTS).toBeDefined();
    expect(exports.METADATA_KEYS).toBeDefined();

    // Factory
    expect(exports.LoggerFactory).toBeDefined();
    expect(exports.LoggerFactory.getLogger).toBeDefined();
    expect(exports.LoggerFactory.clearCache).toBeDefined();
    expect(exports.LoggerFactory.getCacheSize).toBeDefined();
    expect(exports.getLogger).toBeDefined();
    expect(exports.configureLogger).toBeDefined();

    // Simple adapter
    expect(exports.SimpleLoggerAdapter).toBeDefined();
    expect(exports.createSimpleAdapter).toBeDefined();

    // Types utility
    expect(exports.LOG_LEVEL_PRIORITY).toBeDefined();
    expect(exports.shouldLog).toBeDefined();

    // Legacy formatters
    expect(exports.simpleFormatter).toBeDefined();
    expect(exports.jsonFormatter).toBeDefined();
    expect(exports.timestampFormatter).toBeDefined();
    expect(exports.createFormatter).toBeDefined();
    expect(exports.serializeMetadata).toBeDefined();
  });
});
