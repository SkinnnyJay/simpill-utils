/**
 * @simpill/env.utils - Number Parsing
 *
 * This example demonstrates how numeric environment variables are parsed.
 * Invalid numbers fall back to the provided default value.
 *
 * Run: npx ts-node examples/basic/04-number-parsing.ts
 */

import { EnvManager } from "@simpill/env.utils/server";
import { parseNumberEnvValue } from "@simpill/env.utils/shared";

EnvManager.bootstrap();
const env = EnvManager.getInstance();

// ============================================================================
// Number Parsing Rules
// ============================================================================

console.log("=== Number Parsing Rules ===\n");

// Valid integers
console.log("Valid integers:");
console.log(`  "42"     -> ${parseNumberEnvValue("42", 0)}`);
console.log(`  "0"      -> ${parseNumberEnvValue("0", -1)}`);
console.log(`  "-10"    -> ${parseNumberEnvValue("-10", 0)}`);
console.log(`  "3000"   -> ${parseNumberEnvValue("3000", 0)}`);

// Note: parseInt is used, so decimals are truncated
console.log("\nDecimal handling (truncated to integer):");
console.log(`  "3.14"   -> ${parseNumberEnvValue("3.14", 0)}`);
console.log(`  "99.99"  -> ${parseNumberEnvValue("99.99", 0)}`);

// Invalid values fall back to default
console.log("\nInvalid values (fall back to default):");
console.log(`  "abc"    -> ${parseNumberEnvValue("abc", 42)} (default: 42)`);
console.log(`  ""       -> ${parseNumberEnvValue("", 100)} (default: 100)`);
console.log(`  "12abc"  -> ${parseNumberEnvValue("12abc", 0)} (parses leading digits)`);

// ============================================================================
// Common Use Cases
// ============================================================================

console.log("\n=== Common Use Cases ===\n");

// Port configuration
const port = env.getNumber("PORT", 3000);
console.log(`Server port: ${port}`);

// Timeout configuration (in milliseconds)
const timeoutMs = env.getNumber("TIMEOUT_MS", 5000);
console.log(`Request timeout: ${timeoutMs}ms`);

// Connection limits
const maxConnections = env.getNumber("MAX_CONNECTIONS", 100);
console.log(`Max connections: ${maxConnections}`);

// Retry configuration
const retryCount = env.getNumber("RETRY_COUNT", 3);
console.log(`Retry count: ${retryCount}`);

// Cache TTL (in seconds)
const cacheTtl = env.getNumber("CACHE_TTL", 3600);
console.log(`Cache TTL: ${cacheTtl}s (${cacheTtl / 60} minutes)`);

// ============================================================================
// Server Configuration Pattern
// ============================================================================

console.log("\n=== Server Configuration Pattern ===\n");

interface ServerConfig {
  port: number;
  host: string;
  maxConnections: number;
  timeoutMs: number;
  keepAliveMs: number;
  maxRequestSize: number;
}

function loadServerConfig(): ServerConfig {
  return {
    port: env.getNumber("PORT", 3000),
    host: env.getString("HOST", "0.0.0.0"),
    maxConnections: env.getNumber("MAX_CONNECTIONS", 100),
    timeoutMs: env.getNumber("TIMEOUT_MS", 30000),
    keepAliveMs: env.getNumber("KEEP_ALIVE_MS", 5000),
    maxRequestSize: env.getNumber("MAX_REQUEST_SIZE", 1048576), // 1MB default
  };
}

const serverConfig = loadServerConfig();
console.log("Server Configuration:");
console.log(JSON.stringify(serverConfig, null, 2));

// ============================================================================
// Validation Pattern
// ============================================================================

console.log("\n=== Validation Pattern ===\n");

function validatePort(port: number): void {
  if (port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${port}. Must be between 1 and 65535.`);
  }
  if (port < 1024) {
    console.warn(`Warning: Port ${port} requires root privileges.`);
  }
}

function validateTimeout(timeoutMs: number): void {
  if (timeoutMs < 0) {
    throw new Error(`Invalid timeout: ${timeoutMs}. Must be non-negative.`);
  }
  if (timeoutMs > 300000) {
    console.warn(`Warning: Timeout ${timeoutMs}ms is very long (>5 minutes).`);
  }
}

// Validate after loading
try {
  validatePort(serverConfig.port);
  validateTimeout(serverConfig.timeoutMs);
  console.log("Configuration validation passed!");
} catch (error) {
  console.error("Configuration error:", (error as Error).message);
}
