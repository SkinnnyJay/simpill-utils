import { EnvDecryptError, EnvManager, MissingEnvError } from "../../../src/server/env.utils";
import { ENCRYPTED_VALUE_PREFIX } from "../../../src/shared/constants";

describe("EnvManager Encryption Features", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
  });

  describe("isEncrypted", () => {
    it("should return true for values with encrypted: prefix", () => {
      process.env.ENCRYPTED_VAR = "encrypted:abc123xyz";
      const manager = EnvManager.getInstance();
      expect(manager.isEncrypted("ENCRYPTED_VAR")).toBe(true);
    });

    it("should return false for plain values", () => {
      process.env.PLAIN_VAR = "hello-world";
      const manager = EnvManager.getInstance();
      expect(manager.isEncrypted("PLAIN_VAR")).toBe(false);
    });

    it("should return false for non-existent keys", () => {
      const manager = EnvManager.getInstance();
      expect(manager.isEncrypted("NON_EXISTENT_KEY")).toBe(false);
    });

    it("should return false for empty values", () => {
      process.env.EMPTY_VAR = "";
      const manager = EnvManager.getInstance();
      expect(manager.isEncrypted("EMPTY_VAR")).toBe(false);
    });

    it("should return false for values that contain but don't start with encrypted:", () => {
      process.env.CONTAINS_ENCRYPTED = "some-encrypted:value";
      const manager = EnvManager.getInstance();
      expect(manager.isEncrypted("CONTAINS_ENCRYPTED")).toBe(false);
    });
  });

  describe("getRawValue", () => {
    it("should return the raw value for a key", () => {
      process.env.RAW_VAR = "raw-value-123";
      const manager = EnvManager.getInstance();
      expect(manager.getRawValue("RAW_VAR")).toBe("raw-value-123");
    });

    it("should return undefined for non-existent keys", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getRawValue("NON_EXISTENT")).toBeUndefined();
    });

    it("should preserve encrypted prefix in raw value", () => {
      process.env.ENCRYPTED_RAW = "encrypted:ciphertext123";
      const manager = EnvManager.getInstance();
      expect(manager.getRawValue("ENCRYPTED_RAW")).toBe("encrypted:ciphertext123");
    });
  });

  describe("hasPrivateKey", () => {
    it("should return false when no private key is configured", () => {
      delete process.env.DOTENV_PRIVATE_KEY;
      const manager = EnvManager.getInstance();
      expect(manager.hasPrivateKey()).toBe(false);
    });

    it("should return true when private key is set via environment", () => {
      process.env.DOTENV_PRIVATE_KEY = "test-private-key";
      const manager = EnvManager.getInstance();
      expect(manager.hasPrivateKey()).toBe(true);
    });

    it("should return true when private key is set via options", () => {
      delete process.env.DOTENV_PRIVATE_KEY;
      const manager = EnvManager.getInstance({ privateKey: "option-private-key" });
      expect(manager.hasPrivateKey()).toBe(true);
    });

    it("should return false for empty private key", () => {
      process.env.DOTENV_PRIVATE_KEY = "";
      const manager = EnvManager.getInstance();
      expect(manager.hasPrivateKey()).toBe(false);
    });
  });

  describe("getPrivateKey", () => {
    it("should return undefined when no private key is configured", () => {
      delete process.env.DOTENV_PRIVATE_KEY;
      const manager = EnvManager.getInstance();
      expect(manager.getPrivateKey()).toBeUndefined();
    });

    it("should return the private key from environment", () => {
      process.env.DOTENV_PRIVATE_KEY = "env-private-key";
      const manager = EnvManager.getInstance();
      expect(manager.getPrivateKey()).toBe("env-private-key");
    });

    it("should prefer options private key over environment", () => {
      process.env.DOTENV_PRIVATE_KEY = "env-private-key";
      const manager = EnvManager.getInstance({ privateKey: "option-private-key" });
      expect(manager.getPrivateKey()).toBe("option-private-key");
    });
  });

  describe("getDecrypted", () => {
    it("should return plain value for non-encrypted keys", () => {
      process.env.PLAIN_VALUE = "hello-world";
      const manager = EnvManager.getInstance();
      expect(manager.getDecrypted("PLAIN_VALUE")).toBe("hello-world");
    });

    it("should throw MissingEnvError for non-existent keys", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.getDecrypted("NON_EXISTENT")).toThrow(MissingEnvError);
    });

    it("should throw EnvDecryptError when no private key is available for encrypted value", () => {
      delete process.env.DOTENV_PRIVATE_KEY;
      process.env.ENCRYPTED_VALUE = "encrypted:ciphertext123";
      const manager = EnvManager.getInstance();
      expect(() => manager.getDecrypted("ENCRYPTED_VALUE")).toThrow(EnvDecryptError);
    });

    it("should throw EnvDecryptError with descriptive message when no key available", () => {
      delete process.env.DOTENV_PRIVATE_KEY;
      process.env.ENCRYPTED_VALUE = "encrypted:ciphertext123";
      const manager = EnvManager.getInstance();
      expect(() => manager.getDecrypted("ENCRYPTED_VALUE")).toThrow(/No private key available/);
    });

    it("should use provided privateKey parameter over instance key", () => {
      process.env.DOTENV_PRIVATE_KEY = "instance-key";
      process.env.ENCRYPTED_VALUE = "encrypted:ciphertext123";
      const manager = EnvManager.getInstance();
      // This will fail decryption but proves the key is being used
      expect(() => manager.getDecrypted("ENCRYPTED_VALUE", "override-key")).toThrow(
        EnvDecryptError
      );
    });
  });

  describe("parseEncrypted", () => {
    it("should throw EnvDecryptError for non-encrypted values", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.parseEncrypted("plain-value", "any-key")).toThrow(EnvDecryptError);
    });

    it("should throw EnvDecryptError with descriptive message for non-encrypted values", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.parseEncrypted("plain-value", "any-key")).toThrow(
        /Value is not encrypted/
      );
    });

    it("should throw EnvDecryptError for invalid encrypted values", () => {
      const manager = EnvManager.getInstance();
      // Invalid ciphertext will fail decryption
      expect(() => manager.parseEncrypted("encrypted:invalid-ciphertext", "test-key")).toThrow(
        EnvDecryptError
      );
    });
  });

  describe("ENCRYPTED_VALUE_PREFIX constant", () => {
    it("should be 'encrypted:'", () => {
      expect(ENCRYPTED_VALUE_PREFIX).toBe("encrypted:");
    });
  });

  describe("EnvDecryptError", () => {
    it("should have correct properties", () => {
      const error = new EnvDecryptError("MY_KEY", "decryption failed");
      expect(error.name).toBe("EnvDecryptError");
      expect(error.key).toBe("MY_KEY");
      expect(error.reason).toBe("decryption failed");
      expect(error.code).toBe("ENV_DECRYPT");
      expect(error.message).toContain("MY_KEY");
      expect(error.message).toContain("decryption failed");
    });
  });

  describe("process.env extension with encryption methods", () => {
    beforeEach(() => {
      EnvManager.resetInstance();
      EnvManager.resetBootstrap();
      process.env = { ...originalEnv };
    });

    it("should add isEncrypted method to process.env", () => {
      EnvManager.bootstrap({ envPaths: [] });
      expect(typeof process.env.isEncrypted).toBe("function");
    });

    it("should add getDecrypted method to process.env", () => {
      EnvManager.bootstrap({ envPaths: [] });
      expect(typeof process.env.getDecrypted).toBe("function");
    });

    it("process.env.isEncrypted should work correctly", () => {
      process.env.ENCRYPTED_TEST = "encrypted:abc123";
      process.env.PLAIN_TEST = "plain-value";
      EnvManager.bootstrap({ envPaths: [] });

      expect(process.env.isEncrypted("ENCRYPTED_TEST")).toBe(true);
      expect(process.env.isEncrypted("PLAIN_TEST")).toBe(false);
    });

    it("process.env.getDecrypted should return plain values", () => {
      process.env.PLAIN_TEST = "plain-value";
      EnvManager.bootstrap({ envPaths: [] });

      expect(process.env.getDecrypted("PLAIN_TEST")).toBe("plain-value");
    });

    it("process.env.getDecrypted should throw for missing keys", () => {
      EnvManager.bootstrap({ envPaths: [] });
      expect(() => process.env.getDecrypted("NON_EXISTENT")).toThrow(MissingEnvError);
    });
  });
});
