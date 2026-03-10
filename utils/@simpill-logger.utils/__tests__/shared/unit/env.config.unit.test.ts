/**
 * @file Environment Configuration Unit Tests
 * @description Tests for loading logger configuration from environment variables
 */

import { LOG_FORMAT_VALUES, LOG_LEVEL } from "../../../src/shared/constants";
import {
  createFormatterFromEnv,
  ENV_DEFAULTS,
  type EnvLoggerConfig,
  envConfigToAdapterConfig,
  hasEnvConfig,
  loadAdapterConfigFromEnv,
  loadEnvConfig,
} from "../../../src/shared/env.config";
import { ColoredFormatterAdapter, SimpleFormatterAdapter } from "../../../src/shared/formatters";

describe("env.config", () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear logger-related env vars before each test
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
    delete process.env.LOG_TIMESTAMPS;
    delete process.env.LOG_COLORS;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("loadEnvConfig", () => {
    it("should return defaults when no env vars are set", () => {
      const config = loadEnvConfig();

      expect(config).toEqual(ENV_DEFAULTS);
      expect(config.minLevel).toBe(LOG_LEVEL.DEBUG);
      expect(config.format).toBe(LOG_FORMAT_VALUES.PRETTY);
      expect(config.includeTimestamp).toBe(true);
      expect(config.enableColors).toBe(true);
    });

    describe("LOG_LEVEL parsing", () => {
      it.each([
        ["DEBUG", LOG_LEVEL.DEBUG],
        ["debug", LOG_LEVEL.DEBUG],
        ["INFO", LOG_LEVEL.INFO],
        ["info", LOG_LEVEL.INFO],
        ["WARN", LOG_LEVEL.WARN],
        ["warn", LOG_LEVEL.WARN],
        ["ERROR", LOG_LEVEL.ERROR],
        ["error", LOG_LEVEL.ERROR],
      ])("should parse LOG_LEVEL=%s as %s", (envValue, expected) => {
        process.env.LOG_LEVEL = envValue;
        const config = loadEnvConfig();
        expect(config.minLevel).toBe(expected);
      });

      it("should use default for invalid LOG_LEVEL", () => {
        process.env.LOG_LEVEL = "INVALID";
        const config = loadEnvConfig();
        expect(config.minLevel).toBe(ENV_DEFAULTS.minLevel);
      });

      it("should use default for empty LOG_LEVEL", () => {
        process.env.LOG_LEVEL = "";
        const config = loadEnvConfig();
        expect(config.minLevel).toBe(ENV_DEFAULTS.minLevel);
      });

      it("should trim whitespace from LOG_LEVEL", () => {
        process.env.LOG_LEVEL = "  INFO  ";
        const config = loadEnvConfig();
        expect(config.minLevel).toBe(LOG_LEVEL.INFO);
      });
    });

    describe("LOG_FORMAT parsing", () => {
      it.each([
        ["json", LOG_FORMAT_VALUES.JSON],
        ["JSON", LOG_FORMAT_VALUES.JSON],
        ["pretty", LOG_FORMAT_VALUES.PRETTY],
        ["PRETTY", LOG_FORMAT_VALUES.PRETTY],
      ])("should parse LOG_FORMAT=%s as %s", (envValue, expected) => {
        process.env.LOG_FORMAT = envValue;
        const config = loadEnvConfig();
        expect(config.format).toBe(expected);
      });

      it("should use default for invalid LOG_FORMAT", () => {
        process.env.LOG_FORMAT = "xml";
        const config = loadEnvConfig();
        expect(config.format).toBe(ENV_DEFAULTS.format);
      });

      it("should trim whitespace from LOG_FORMAT", () => {
        process.env.LOG_FORMAT = "  json  ";
        const config = loadEnvConfig();
        expect(config.format).toBe(LOG_FORMAT_VALUES.JSON);
      });
    });

    describe("LOG_TIMESTAMPS parsing", () => {
      it.each([
        ["true", true],
        ["TRUE", true],
        ["1", true],
        ["false", false],
        ["FALSE", false],
        ["0", false],
      ])("should parse LOG_TIMESTAMPS=%s as %s (strict)", (envValue, expected) => {
        process.env.LOG_TIMESTAMPS = envValue;
        const config = loadEnvConfig();
        expect(config.includeTimestamp).toBe(expected);
      });

      it("should use default for non-strict values like 'no' or 'yes'", () => {
        process.env.LOG_TIMESTAMPS = "no";
        expect(loadEnvConfig().includeTimestamp).toBe(ENV_DEFAULTS.includeTimestamp);
        process.env.LOG_TIMESTAMPS = "yes";
        expect(loadEnvConfig().includeTimestamp).toBe(ENV_DEFAULTS.includeTimestamp);
      });

      it("should use default for invalid LOG_TIMESTAMPS", () => {
        process.env.LOG_TIMESTAMPS = "maybe";
        const config = loadEnvConfig();
        expect(config.includeTimestamp).toBe(ENV_DEFAULTS.includeTimestamp);
      });

      it("should trim whitespace from LOG_TIMESTAMPS", () => {
        process.env.LOG_TIMESTAMPS = "  false  ";
        const config = loadEnvConfig();
        expect(config.includeTimestamp).toBe(false);
      });
    });

    describe("LOG_COLORS parsing", () => {
      it.each([
        ["true", true],
        ["1", true],
        ["false", false],
        ["0", false],
      ])("should parse LOG_COLORS=%s as %s (strict)", (envValue, expected) => {
        process.env.LOG_COLORS = envValue;
        const config = loadEnvConfig();
        expect(config.enableColors).toBe(expected);
      });

      it("should use default for invalid LOG_COLORS", () => {
        process.env.LOG_COLORS = "rainbow";
        const config = loadEnvConfig();
        expect(config.enableColors).toBe(ENV_DEFAULTS.enableColors);
      });
    });

    it("should parse multiple env vars together", () => {
      process.env.LOG_LEVEL = "WARN";
      process.env.LOG_FORMAT = "json";
      process.env.LOG_TIMESTAMPS = "false";
      process.env.LOG_COLORS = "false";

      const config = loadEnvConfig();

      expect(config).toEqual({
        minLevel: LOG_LEVEL.WARN,
        format: LOG_FORMAT_VALUES.JSON,
        includeTimestamp: false,
        enableColors: false,
      });
    });
  });

  describe("hasEnvConfig", () => {
    it("should return false when no env vars are set", () => {
      expect(hasEnvConfig()).toBe(false);
    });

    it("should return true when LOG_LEVEL is set", () => {
      process.env.LOG_LEVEL = "INFO";
      expect(hasEnvConfig()).toBe(true);
    });

    it("should return true when LOG_FORMAT is set", () => {
      process.env.LOG_FORMAT = "json";
      expect(hasEnvConfig()).toBe(true);
    });

    it("should return true when LOG_TIMESTAMPS is set", () => {
      process.env.LOG_TIMESTAMPS = "false";
      expect(hasEnvConfig()).toBe(true);
    });

    it("should return true when LOG_COLORS is set", () => {
      process.env.LOG_COLORS = "false";
      expect(hasEnvConfig()).toBe(true);
    });

    it("should return true when multiple env vars are set", () => {
      process.env.LOG_LEVEL = "INFO";
      process.env.LOG_FORMAT = "json";
      expect(hasEnvConfig()).toBe(true);
    });
  });

  describe("createFormatterFromEnv", () => {
    it("should create SimpleFormatterAdapter with jsonOutput for json format", () => {
      const config: EnvLoggerConfig = {
        minLevel: LOG_LEVEL.INFO,
        format: LOG_FORMAT_VALUES.JSON,
        includeTimestamp: true,
        enableColors: true,
      };

      const formatter = createFormatterFromEnv(config);

      expect(formatter).toBeInstanceOf(SimpleFormatterAdapter);
    });

    it("should create ColoredFormatterAdapter for pretty format with colors", () => {
      const config: EnvLoggerConfig = {
        minLevel: LOG_LEVEL.INFO,
        format: LOG_FORMAT_VALUES.PRETTY,
        includeTimestamp: true,
        enableColors: true,
      };

      const formatter = createFormatterFromEnv(config);

      expect(formatter).toBeInstanceOf(ColoredFormatterAdapter);
    });

    it("should create SimpleFormatterAdapter for pretty format without colors", () => {
      const config: EnvLoggerConfig = {
        minLevel: LOG_LEVEL.INFO,
        format: LOG_FORMAT_VALUES.PRETTY,
        includeTimestamp: true,
        enableColors: false,
      };

      const formatter = createFormatterFromEnv(config);

      expect(formatter).toBeInstanceOf(SimpleFormatterAdapter);
    });
  });

  describe("envConfigToAdapterConfig", () => {
    it("should convert env config to adapter config", () => {
      const envConfig: EnvLoggerConfig = {
        minLevel: LOG_LEVEL.WARN,
        format: LOG_FORMAT_VALUES.JSON,
        includeTimestamp: false,
        enableColors: false,
      };

      const adapterConfig = envConfigToAdapterConfig(envConfig);

      expect(adapterConfig.minLevel).toBe(LOG_LEVEL.WARN);
      expect(adapterConfig.includeTimestamp).toBe(false);
      expect(adapterConfig.prettyPrint).toBe(false);
      expect(adapterConfig.formatter).toBeInstanceOf(SimpleFormatterAdapter);
    });

    it("should set prettyPrint true for pretty format", () => {
      const envConfig: EnvLoggerConfig = {
        minLevel: LOG_LEVEL.INFO,
        format: LOG_FORMAT_VALUES.PRETTY,
        includeTimestamp: true,
        enableColors: true,
      };

      const adapterConfig = envConfigToAdapterConfig(envConfig);

      expect(adapterConfig.prettyPrint).toBe(true);
      expect(adapterConfig.formatter).toBeInstanceOf(ColoredFormatterAdapter);
    });
  });

  describe("loadAdapterConfigFromEnv", () => {
    it("should load and convert config in one call", () => {
      process.env.LOG_LEVEL = "ERROR";
      process.env.LOG_FORMAT = "json";
      process.env.LOG_TIMESTAMPS = "false";

      const config = loadAdapterConfigFromEnv();

      expect(config.minLevel).toBe(LOG_LEVEL.ERROR);
      expect(config.includeTimestamp).toBe(false);
      expect(config.prettyPrint).toBe(false);
      expect(config.formatter).toBeDefined();
    });

    it("should return defaults when no env vars set", () => {
      const config = loadAdapterConfigFromEnv();

      expect(config.minLevel).toBe(ENV_DEFAULTS.minLevel);
      expect(config.includeTimestamp).toBe(ENV_DEFAULTS.includeTimestamp);
      expect(config.prettyPrint).toBe(true); // pretty is default
    });
  });
});
