/**
 * Type augmentation for process.env to include extended methods
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Standard getters with defaults
      /**
       * Get a string environment variable with a default value.
       */
      getString(key: string, defaultValue?: string): string;

      /**
       * Get a number environment variable with a default value.
       * Supports both integers and floating-point numbers.
       */
      getNumber(key: string, defaultValue?: number): number;

      /**
       * Get a boolean environment variable with a default value.
       * Accepts "true", "1", "yes" as true and "false", "0", "no" as false (case-insensitive).
       */
      getBoolean(key: string, defaultValue?: boolean): boolean;

      // Required getters (throw if missing)
      /**
       * Get a required string environment variable.
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message
       * @throws {MissingEnvError} When the environment variable is not set.
       */
      getRequired(key: string, errorMessage?: string): string;

      /**
       * Get a required string environment variable.
       * Alias for getRequired().
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message
       * @throws {MissingEnvError} When the environment variable is not set.
       */
      getRequiredString(key: string, errorMessage?: string): string;

      /**
       * Get a required number environment variable.
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message for missing variable
       * @throws {MissingEnvError} When the environment variable is not set.
       * @throws {EnvParseError} When the value cannot be parsed as a number.
       */
      getRequiredNumber(key: string, errorMessage?: string): number;

      /**
       * Get a required boolean environment variable.
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message for missing variable
       * @throws {MissingEnvError} When the environment variable is not set.
       * @throws {EnvParseError} When the value cannot be parsed as a boolean.
       */
      getRequiredBoolean(key: string, errorMessage?: string): boolean;

      // Strict getters (throw if missing or invalid)
      /**
       * Get a string environment variable, throwing if not set.
       * Alias for getRequired().
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message
       * @throws {MissingEnvError} When the environment variable is not set.
       */
      getStringStrict(key: string, errorMessage?: string): string;

      /**
       * Get a number environment variable, throwing if not set or invalid.
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message for missing variable
       * @throws {MissingEnvError} When the environment variable is not set.
       * @throws {EnvParseError} When the value cannot be parsed as a number.
       */
      getNumberStrict(key: string, errorMessage?: string): number;

      /**
       * Get a boolean environment variable, throwing if not set or invalid.
       * @param key - The environment variable name
       * @param errorMessage - Optional custom error message for missing variable
       * @throws {MissingEnvError} When the environment variable is not set.
       * @throws {EnvParseError} When the value cannot be parsed as a boolean.
       */
      getBooleanStrict(key: string, errorMessage?: string): boolean;

      // Utility methods
      /**
       * Check if an environment variable exists in the cache.
       */
      has(key: string): boolean;

      /**
       * Check if an environment variable value is encrypted.
       * Returns true if the raw value starts with "encrypted:" prefix.
       */
      isEncrypted(key: string): boolean;

      /**
       * Get a decrypted environment variable value.
       * If the value is not encrypted, returns the plain value.
       * @param key - The environment variable key
       * @param privateKey - Optional private key to use for decryption
       * @throws {MissingEnvError} When the environment variable is not set.
       * @throws {EnvDecryptError} When decryption fails.
       */
      getDecrypted(key: string, privateKey?: string): string;
    }
  }
}

export {};
