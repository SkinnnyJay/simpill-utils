/**
 * Integration tests for encryption features using fixture files.
 *
 * These tests validate encryption detection and handling using the
 * env.test.encrypted fixture file.
 */
import { EnvManager } from "../../../src/server/env.utils";
import { ENV_TEST_ENCRYPTED } from "../../fixtures";

describe("EnvManager encryption with fixture files", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = { ...originalEnv };
    // Ensure no private key is set for most tests
    delete process.env.DOTENV_PRIVATE_KEY;
  });

  afterEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = originalEnv;
  });

  describe("env.test.encrypted fixture", () => {
    it("should load the encrypted fixture", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });
      expect(manager).toBeDefined();
    });

    it("should correctly identify plain values as not encrypted", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.isEncrypted("PLAIN_STRING")).toBe(false);
      expect(manager.isEncrypted("PLAIN_NUMBER")).toBe(false);
      expect(manager.isEncrypted("PLAIN_BOOLEAN")).toBe(false);
    });

    it("should correctly identify encrypted values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.isEncrypted("ENCRYPTED_API_KEY")).toBe(true);
      expect(manager.isEncrypted("ENCRYPTED_DATABASE_URL")).toBe(true);
      expect(manager.isEncrypted("ENCRYPTED_SECRET")).toBe(true);
    });

    it("should read plain values normally", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.getString("PLAIN_STRING")).toBe("hello-world");
      expect(manager.getNumber("PLAIN_NUMBER")).toBe(42);
      expect(manager.getBoolean("PLAIN_BOOLEAN")).toBe(true);
    });

    it("should return raw encrypted values via getString", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      // Without decryption, getString returns the raw encrypted value
      const rawValue = manager.getString("ENCRYPTED_API_KEY");
      expect(rawValue.startsWith("encrypted:")).toBe(true);
    });

    it("should return raw encrypted values via getRawValue", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      const rawValue = manager.getRawValue("ENCRYPTED_API_KEY");
      expect(rawValue).toBeDefined();
      expect(rawValue?.startsWith("encrypted:")).toBe(true);
    });

    it("should handle mixed encrypted and plain values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      // Plain values
      expect(manager.getString("CONFIG_NAME")).toBe("my-app");
      expect(manager.getBoolean("CONFIG_DEBUG")).toBe(false);

      // Encrypted value
      expect(manager.isEncrypted("CONFIG_SECRET")).toBe(true);
    });
  });

  describe("getDecrypted with fixture", () => {
    it("should return plain values without decryption", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.getDecrypted("PLAIN_STRING")).toBe("hello-world");
      expect(manager.getDecrypted("CONFIG_NAME")).toBe("my-app");
    });

    it("should throw when trying to decrypt without private key", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(() => manager.getDecrypted("ENCRYPTED_API_KEY")).toThrow(/No private key available/);
    });
  });

  describe("privateKey option", () => {
    it("should accept privateKey in options", () => {
      const manager = EnvManager.getInstance({
        envPath: ENV_TEST_ENCRYPTED,
        privateKey: "test-private-key",
      });

      expect(manager.hasPrivateKey()).toBe(true);
      expect(manager.getPrivateKey()).toBe("test-private-key");
    });

    it("should prefer options privateKey over environment", () => {
      process.env.DOTENV_PRIVATE_KEY = "env-key";
      const manager = EnvManager.getInstance({
        envPath: ENV_TEST_ENCRYPTED,
        privateKey: "options-key",
      });

      expect(manager.getPrivateKey()).toBe("options-key");
    });

    it("should fall back to environment privateKey", () => {
      process.env.DOTENV_PRIVATE_KEY = "env-key";
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.getPrivateKey()).toBe("env-key");
    });
  });

  describe("multiple fixture files with encryption", () => {
    it("should track encryption status across multiple files", () => {
      const manager = EnvManager.getInstance({
        envPaths: [ENV_TEST_ENCRYPTED],
      });

      // From encrypted fixture
      expect(manager.isEncrypted("ENCRYPTED_API_KEY")).toBe(true);
      expect(manager.isEncrypted("PLAIN_STRING")).toBe(false);
    });
  });

  describe("has() with encrypted values", () => {
    it("should return true for encrypted values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.has("ENCRYPTED_API_KEY")).toBe(true);
      expect(manager.has("ENCRYPTED_DATABASE_URL")).toBe(true);
    });

    it("should return true for plain values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.has("PLAIN_STRING")).toBe(true);
      expect(manager.has("CONFIG_NAME")).toBe(true);
    });

    it("should return false for non-existent keys", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_ENCRYPTED });

      expect(manager.has("NON_EXISTENT_KEY")).toBe(false);
    });
  });
});
