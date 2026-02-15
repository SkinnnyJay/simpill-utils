/**
 * @simpill/env.utils - EnvManager Basics
 *
 * This example demonstrates the core EnvManager class for server-side
 * environment variable management with .env file support.
 *
 * Run: npx ts-node examples/server/01-env-manager-basics.ts
 */

import { EnvManager } from "@simpill/env.utils/server";

// ============================================================================
// Bootstrap Pattern (Recommended)
// ============================================================================

// Bootstrap loads .env files into process.env
// Call this ONCE at application startup (e.g., in your entry point)
EnvManager.bootstrap();

// Check if bootstrap has been called
console.log("Is bootstrapped:", EnvManager.isBootstrapped());

// Get the singleton instance for reading values
const env = EnvManager.getInstance();

// ============================================================================
// Reading Environment Variables
// ============================================================================

console.log("\n=== Reading Values ===\n");

// String values
const appName = env.getString("APP_NAME", "default-app");
const apiUrl = env.getString("API_URL", "http://localhost");
console.log(`App: ${appName}`);
console.log(`API URL: ${apiUrl}`);

// Number values
const port = env.getNumber("PORT", 3000);
const timeout = env.getNumber("TIMEOUT_MS", 5000);
console.log(`Port: ${port}`);
console.log(`Timeout: ${timeout}ms`);

// Boolean values
const debug = env.getBoolean("DEBUG_MODE", false);
const analytics = env.getBoolean("FEATURE_ANALYTICS", true);
console.log(`Debug: ${debug}`);
console.log(`Analytics: ${analytics}`);

// ============================================================================
// Checking Variable Existence
// ============================================================================

console.log("\n=== Checking Existence ===\n");

// has() returns true if the variable is defined (even if empty)
console.log(`Has APP_NAME: ${env.has("APP_NAME")}`);
console.log(`Has UNDEFINED_VAR: ${env.has("UNDEFINED_VAR")}`);

// getValue() returns undefined if not set (for optional values)
const optionalValue = env.getValue("OPTIONAL_CONFIG");
console.log(`Optional value: ${optionalValue ?? "(not set)"}`);

// getValueOrDefault() always returns a string
const withDefault = env.getValueOrDefault("OPTIONAL_CONFIG", "fallback");
console.log(`With default: ${withDefault}`);

// ============================================================================
// Environment Detection
// ============================================================================

console.log("\n=== Environment Detection ===\n");

const currentEnv = env.getEnvironment();
const isProd = env.isProduction();
const isDev = env.isDevelopment();

console.log(`Current environment: ${currentEnv}`);
console.log(`Is production: ${isProd}`);
console.log(`Is development: ${isDev}`);

// Common pattern: conditional logic based on environment
if (isProd) {
  console.log("Running in production mode");
} else if (isDev) {
  console.log("Running in development mode");
} else {
  console.log(`Running in ${currentEnv} mode`);
}

// ============================================================================
// Cache Information
// ============================================================================

console.log("\n=== Cache Information ===\n");

// Check cache size (useful for debugging)
console.log(`Cache size: ${env.getCacheSize()} entries`);

// Check if dynamic mode is enabled (default: false)
console.log(`Dynamic mode: ${env.isDynamic()}`);

// For dynamic mode and refresh(), see:
// examples/advanced/05-dynamic-mode.ts

// ============================================================================
// Singleton Pattern
// ============================================================================

console.log("\n=== Singleton Pattern ===\n");

// getInstance() always returns the same instance
const env1 = EnvManager.getInstance();
const env2 = EnvManager.getInstance();
console.log(`Same instance: ${env1 === env2}`); // true

// This ensures consistent state across your application
