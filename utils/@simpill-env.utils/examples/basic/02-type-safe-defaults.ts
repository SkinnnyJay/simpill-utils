/**
 * @simpill/env.utils - Type-Safe Defaults
 *
 * This example shows how default values provide type safety and
 * prevent undefined values from propagating through your application.
 *
 * Run: npx ts-node examples/basic/02-type-safe-defaults.ts
 */

import { EnvManager } from "@simpill/env.utils/server";

EnvManager.bootstrap();
const env = EnvManager.getInstance();

// ============================================================================
// The Problem with Raw process.env
// ============================================================================

// Raw process.env always returns string | undefined
const rawValue: string | undefined = process.env.SOME_CONFIG;

// You must handle undefined everywhere
if (rawValue !== undefined) {
  // Now you can use it, but it's still a string
  console.log(rawValue.toUpperCase());
}

// ============================================================================
// The Solution: Type-Safe Getters
// ============================================================================

// getString always returns a string (never undefined)
const configValue: string = env.getString("SOME_CONFIG", "default");
console.log(configValue.toUpperCase()); // Safe! No undefined check needed

// getNumber always returns a number
const port: number = env.getNumber("PORT", 3000);
console.log(port + 1); // Safe! It's definitely a number

// getBoolean always returns a boolean
const enabled: boolean = env.getBoolean("ENABLED", false);
console.log(enabled ? "ON" : "OFF"); // Safe! It's definitely a boolean

// ============================================================================
// Practical Configuration Pattern
// ============================================================================

interface AppConfig {
  name: string;
  port: number;
  debug: boolean;
  apiUrl: string;
  maxRetries: number;
  timeoutMs: number;
}

// Build a fully-typed config object with guaranteed values
function loadConfig(): AppConfig {
  return {
    name: env.getString("APP_NAME", "my-app"),
    port: env.getNumber("PORT", 3000),
    debug: env.getBoolean("DEBUG_MODE", false),
    apiUrl: env.getString("API_URL", "http://localhost:8080"),
    maxRetries: env.getNumber("RETRY_COUNT", 3),
    timeoutMs: env.getNumber("TIMEOUT_MS", 5000),
  };
}

const config = loadConfig();
console.log("\nLoaded Configuration:");
console.log(JSON.stringify(config, null, 2));

// ============================================================================
// Required vs Optional Configuration
// ============================================================================

// For truly required values, check existence and throw early
function getRequiredConfig(): { apiKey: string; dbUrl: string } {
  if (!env.has("API_KEY")) {
    throw new Error("API_KEY environment variable is required");
  }
  if (!env.has("DATABASE_URL")) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return {
    apiKey: env.getString("API_KEY"),
    dbUrl: env.getString("DATABASE_URL"),
  };
}

// Demonstrate the pattern (won't throw since we're just showing the pattern)
console.log("\nRequired config pattern defined (getRequiredConfig)");
console.log("Would throw if API_KEY or DATABASE_URL missing");
void getRequiredConfig; // Acknowledge the function exists

// Optional values use defaults
function getOptionalConfig() {
  return {
    logLevel: env.getString("LOG_LEVEL", "info"),
    cacheTtl: env.getNumber("CACHE_TTL", 3600),
    analyticsEnabled: env.getBoolean("FEATURE_ANALYTICS", true),
  };
}

console.log("\nOptional Config:", getOptionalConfig());
