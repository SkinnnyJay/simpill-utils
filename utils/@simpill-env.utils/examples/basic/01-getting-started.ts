/**
 * @simpill/env.utils - Getting Started
 *
 * This example demonstrates the most basic usage patterns for reading
 * environment variables with type safety and defaults.
 *
 * Run: npx ts-node examples/basic/01-getting-started.ts
 */

import { EnvManager } from "@simpill/env.utils/server";

// Bootstrap loads .env files into process.env (call once at app startup)
EnvManager.bootstrap();

// Get the singleton instance
const env = EnvManager.getInstance();

// ============================================================================
// Basic String Access
// ============================================================================

// Get a string with a default value
const appName = env.getString("APP_NAME", "default-app");
console.log(`App Name: ${appName}`);

// Get a string that might not exist (empty string default)
const optionalConfig = env.getString("OPTIONAL_CONFIG");
console.log(`Optional Config: "${optionalConfig}"`);

// ============================================================================
// Number Access
// ============================================================================

// Get a number with a default
const port = env.getNumber("PORT", 3000);
console.log(`Port: ${port}`);

// Get a number for timeouts, limits, etc.
const maxConnections = env.getNumber("MAX_CONNECTIONS", 10);
const timeoutMs = env.getNumber("TIMEOUT_MS", 5000);
console.log(`Max Connections: ${maxConnections}, Timeout: ${timeoutMs}ms`);

// ============================================================================
// Boolean Access
// ============================================================================

// Booleans accept: "true", "1" as true; "false", "0" as false
const debugMode = env.getBoolean("DEBUG_MODE", false);
const featureEnabled = env.getBoolean("FEATURE_DARK_MODE", false);
console.log(`Debug Mode: ${debugMode}, Dark Mode: ${featureEnabled}`);

// ============================================================================
// Checking Existence
// ============================================================================

// Check if a variable is defined (useful for required configs)
const hasApiKey = env.has("API_KEY");
const hasMissingVar = env.has("DEFINITELY_NOT_SET");
console.log(`Has API_KEY: ${hasApiKey}, Has DEFINITELY_NOT_SET: ${hasMissingVar}`);

// ============================================================================
// Environment Detection
// ============================================================================

// Check the current environment
const currentEnv = env.getEnvironment();
const isProd = env.isProduction();
console.log(`Environment: ${currentEnv}, Is Production: ${isProd}`);
