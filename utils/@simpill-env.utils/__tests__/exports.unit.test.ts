/**
 * @file Exports Unit Tests
 * @description Tests to verify all exports are accessible from entry points
 */

describe("Main exports (src/index.ts)", () => {
  it("should export all server utilities", async () => {
    const exports = await import("../src/index");

    // EnvManager class
    expect(exports.EnvManager).toBeDefined();
    expect(exports.EnvManager.getInstance).toBeDefined();
    expect(exports.EnvManager.bootstrap).toBeDefined();
    expect(exports.EnvManager.resetInstance).toBeDefined();
    expect(exports.EnvManager.resetBootstrap).toBeDefined();
    expect(exports.EnvManager.isBootstrapped).toBeDefined();
    expect(exports.EnvManager.extendProcessEnvPrototype).toBeDefined();

    // Env class
    expect(exports.Env).toBeDefined();

    // Legacy function
    expect(exports.extendProcessEnvPrototype).toBeDefined();
  });

  it("should export all shared utilities", async () => {
    const exports = await import("../src/index");

    // Constants (only encryption-related are exported from main)
    expect(exports.ENCRYPTED_VALUE_PREFIX).toBeDefined();
    expect(exports.DEFAULT_KEY_PATHS).toBeDefined();

    // Errors
    expect(exports.EnvError).toBeDefined();
    expect(exports.MissingEnvError).toBeDefined();
    expect(exports.EnvParseError).toBeDefined();
    expect(exports.EnvValidationError).toBeDefined();
    expect(exports.EnvDecryptError).toBeDefined();
    expect(exports.ENV_ERROR_CODE).toBeDefined();

    // Parse helpers
    expect(exports.parseBooleanEnvValue).toBeDefined();
    expect(exports.parseBooleanEnvValueStrict).toBeDefined();
    expect(exports.parseNumberEnvValue).toBeDefined();
    expect(exports.parseNumberEnvValueStrict).toBeDefined();
  });

  it("should export all client utilities", async () => {
    const exports = await import("../src/index");

    expect(exports.getEdgeEnv).toBeDefined();
    expect(exports.getEdgeString).toBeDefined();
    expect(exports.getEdgeNumber).toBeDefined();
    expect(exports.getEdgeBoolean).toBeDefined();
    expect(exports.hasEdgeEnv).toBeDefined();
    expect(exports.isEdgeProd).toBeDefined();
    expect(exports.isEdgeDev).toBeDefined();
  });
});

describe("Server exports (src/server/index.ts)", () => {
  it("should export all server utilities", async () => {
    const exports = await import("../src/server/index");

    // EnvManager class
    expect(exports.EnvManager).toBeDefined();
    expect(exports.EnvManager.getInstance).toBeDefined();
    expect(exports.EnvManager.bootstrap).toBeDefined();

    // Env class
    expect(exports.Env).toBeDefined();

    // Errors
    expect(exports.MissingEnvError).toBeDefined();
    expect(exports.EnvDecryptError).toBeDefined();

    // Legacy function
    expect(exports.extendProcessEnvPrototype).toBeDefined();
  });
});

describe("Client exports (src/client/index.ts)", () => {
  it("should export all client utilities", async () => {
    const exports = await import("../src/client/index");

    expect(exports.getEdgeEnv).toBeDefined();
    expect(exports.getEdgeString).toBeDefined();
    expect(exports.getEdgeNumber).toBeDefined();
    expect(exports.getEdgeBoolean).toBeDefined();
    expect(exports.hasEdgeEnv).toBeDefined();
    expect(exports.isEdgeProd).toBeDefined();
    expect(exports.isEdgeDev).toBeDefined();
  });
});

describe("Shared exports (src/shared/index.ts)", () => {
  it("should export all shared utilities", async () => {
    const exports = await import("../src/shared/index");

    // Constants
    expect(exports.NODE_ENV).toBeDefined();
    expect(exports.ENV_KEY).toBeDefined();
    expect(exports.DEFAULT_ENV_PATHS).toBeDefined();
    expect(exports.DEFAULT_KEY_PATHS).toBeDefined();
    expect(exports.LOG_PREFIX).toBeDefined();
    expect(exports.ENCRYPTED_VALUE_PREFIX).toBeDefined();
    expect(exports.BOOLEAN_TRUTHY).toBeDefined();
    expect(exports.BOOLEAN_FALSY).toBeDefined();
    expect(exports.ENV_PARSE_TYPE).toBeDefined();

    // Errors
    expect(exports.EnvError).toBeDefined();
    expect(exports.MissingEnvError).toBeDefined();
    expect(exports.EnvParseError).toBeDefined();
    expect(exports.EnvValidationError).toBeDefined();
    expect(exports.EnvDecryptError).toBeDefined();
    expect(exports.ENV_ERROR_CODE).toBeDefined();

    // Parse helpers
    expect(exports.parseBooleanEnvValue).toBeDefined();
    expect(exports.parseBooleanEnvValueStrict).toBeDefined();
    expect(exports.parseNumberEnvValue).toBeDefined();
    expect(exports.parseNumberEnvValueStrict).toBeDefined();
  });
});

describe("EnvManager instance methods", () => {
  beforeEach(async () => {
    const { EnvManager } = await import("../src/server/env.utils");
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
  });

  afterEach(async () => {
    const { EnvManager } = await import("../src/server/env.utils");
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
  });

  it("should have all instance methods", async () => {
    const { EnvManager } = await import("../src/server/env.utils");
    const manager = EnvManager.getInstance();

    // Core getters
    expect(manager.getString).toBeDefined();
    expect(manager.getNumber).toBeDefined();
    expect(manager.getBoolean).toBeDefined();
    expect(manager.getValue).toBeDefined();
    expect(manager.getValueOrDefault).toBeDefined();
    expect(manager.has).toBeDefined();

    // Strict getters
    expect(manager.getNumberStrict).toBeDefined();
    expect(manager.getBooleanStrict).toBeDefined();

    // Environment detection
    expect(manager.getEnvironment).toBeDefined();
    expect(manager.isProduction).toBeDefined();
    expect(manager.isDevelopment).toBeDefined();

    // Encryption methods
    expect(manager.isEncrypted).toBeDefined();
    expect(manager.getDecrypted).toBeDefined();
    expect(manager.getRawValue).toBeDefined();
    expect(manager.parseEncrypted).toBeDefined();
    expect(manager.hasPrivateKey).toBeDefined();
    expect(manager.getPrivateKey).toBeDefined();

    // Cache management (new methods)
    expect(manager.isDynamic).toBeDefined();
    expect(manager.refresh).toBeDefined();
    expect(manager.getCacheSize).toBeDefined();
  });

  it("should support dynamic mode option", async () => {
    const { EnvManager } = await import("../src/server/env.utils");

    // Default: cached mode
    const cachedManager = EnvManager.getInstance();
    expect(cachedManager.isDynamic()).toBe(false);

    // Reset and create with dynamic mode
    EnvManager.resetInstance();
    const dynamicManager = EnvManager.getInstance({ dynamic: true });
    expect(dynamicManager.isDynamic()).toBe(true);
  });

  it("should support refresh method", async () => {
    const { EnvManager } = await import("../src/server/env.utils");
    const manager = EnvManager.getInstance();

    const initialSize = manager.getCacheSize();
    expect(initialSize).toBeGreaterThan(0);

    // refresh() should not throw
    expect(() => manager.refresh()).not.toThrow();
  });
});
