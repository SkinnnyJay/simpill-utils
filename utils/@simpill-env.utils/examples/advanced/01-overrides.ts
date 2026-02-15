/**
 * @simpill/env.utils - Manual Overrides
 *
 * This example demonstrates how to use manual overrides to set
 * environment variables programmatically, useful for testing and
 * dynamic configuration.
 *
 * Run: npx ts-node examples/advanced/01-overrides.ts
 */

import { EnvManager, type EnvManagerOptions } from "@simpill/env.utils/server";

// ============================================================================
// Manual Overrides
// ============================================================================

console.log("=== Manual Overrides ===\n");

// Reset for clean demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Overrides take highest priority over .env files and process.env
const options: EnvManagerOptions = {
  overrides: {
    APP_NAME: "override-app",
    PORT: "9999",
    DEBUG_MODE: "true",
    CUSTOM_VALUE: "from-override",
  },
};

EnvManager.bootstrap(options);
const env = EnvManager.getInstance(options);

console.log("Values with overrides:");
console.log(`  APP_NAME: ${env.getString("APP_NAME", "default")}`);
console.log(`  PORT: ${env.getNumber("PORT", 3000)}`);
console.log(`  DEBUG_MODE: ${env.getBoolean("DEBUG_MODE", false)}`);
console.log(`  CUSTOM_VALUE: ${env.getString("CUSTOM_VALUE", "none")}`);

// ============================================================================
// Priority Order
// ============================================================================

console.log("\n=== Priority Order ===\n");

console.log("Values are resolved in this order (highest to lowest):");
console.log("  1. Manual overrides (options.overrides)");
console.log("  2. process.env (system environment)");
console.log("  3. .env files (in order specified)");
console.log("  4. Default value (provided in getter)");

// ============================================================================
// Testing Pattern
// ============================================================================

console.log("\n=== Testing Pattern ===\n");

// For unit tests, use overrides to control environment
function runTestWithConfig(testOverrides: Record<string, string>): void {
  // Reset between tests
  EnvManager.resetInstance();
  EnvManager.resetBootstrap();

  // Bootstrap with test overrides
  EnvManager.bootstrap({ overrides: testOverrides });
  const testEnv = EnvManager.getInstance({ overrides: testOverrides });

  // Run test assertions
  console.log(`Test config: ${JSON.stringify(testOverrides)}`);
  console.log(`  Result: PORT=${testEnv.getNumber("PORT", 0)}`);
}

// Simulate different test scenarios
runTestWithConfig({ PORT: "3000", NODE_ENV: "test" });
runTestWithConfig({ PORT: "8080", NODE_ENV: "production" });
runTestWithConfig({ PORT: "443", NODE_ENV: "staging" });

// ============================================================================
// Dynamic Configuration
// ============================================================================

console.log("\n=== Dynamic Configuration ===\n");

// Reset for demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Build overrides dynamically based on conditions
function buildDynamicOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};

  // Example: Set debug mode based on user flag
  const userWantsDebug = process.argv.includes("--debug");
  if (userWantsDebug) {
    overrides.DEBUG_MODE = "true";
    overrides.LOG_LEVEL = "debug";
  }

  // Example: Override API URL for local development
  const useLocalApi = process.argv.includes("--local-api");
  if (useLocalApi) {
    overrides.API_URL = "http://localhost:8080";
  }

  return overrides;
}

const dynamicOverrides = buildDynamicOverrides();
console.log("Dynamic overrides:", dynamicOverrides);

EnvManager.bootstrap({ overrides: dynamicOverrides });

// ============================================================================
// Combining with .env Files
// ============================================================================

console.log("\n=== Combining with .env Files ===\n");

// Reset for demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Load .env files AND apply overrides
const combinedOptions: EnvManagerOptions = {
  envPaths: [".env", ".env.local"],
  overload: true,
  overrides: {
    // These will override values from .env files
    OVERRIDE_ONLY: "this-is-only-from-override",
  },
};

EnvManager.bootstrap(combinedOptions);
console.log("Combined loading: .env files + overrides");
console.log("  .env files provide base configuration");
console.log("  Overrides provide runtime/test-specific values");
