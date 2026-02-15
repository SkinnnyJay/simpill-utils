/**
 * @simpill/env.utils - Custom .env File Paths
 *
 * This example demonstrates how to load environment variables from
 * custom file paths instead of the default .env and .env.local.
 *
 * Run: npx ts-node examples/server/04-custom-env-paths.ts
 */

import { EnvManager, type EnvManagerOptions } from "@simpill/env.utils/server";
import { DEFAULT_ENV_PATHS } from "@simpill/env.utils/shared";

// ============================================================================
// Default Behavior
// ============================================================================

console.log("=== Default .env Paths ===\n");

// By default, EnvManager loads these files (in order):
console.log("Default paths:", DEFAULT_ENV_PATHS);
// [".env.local", ".env"]

// Later files do NOT override earlier ones by default
// .env.local values take precedence over .env

// ============================================================================
// Single Custom Path
// ============================================================================

console.log("\n=== Single Custom Path ===\n");

// Reset for demo (normally you wouldn't do this)
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Load from a single custom path
const singlePathOptions: EnvManagerOptions = {
  envPath: ".env.production",
};

EnvManager.bootstrap(singlePathOptions);
console.log("Loaded from: .env.production");

// ============================================================================
// Multiple Custom Paths
// ============================================================================

console.log("\n=== Multiple Custom Paths ===\n");

// Reset for demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Load from multiple paths in order
const multiPathOptions: EnvManagerOptions = {
  envPaths: [".env.defaults", ".env.local", ".env"],
};

EnvManager.bootstrap(multiPathOptions);
console.log("Loaded from:", multiPathOptions.envPaths);

// ============================================================================
// Environment-Specific Files
// ============================================================================

console.log("\n=== Environment-Specific Pattern ===\n");

// Reset for demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Common pattern: load base config, then environment-specific overrides
function getEnvPaths(): readonly string[] {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return [
    ".env", // Base defaults
    `.env.${nodeEnv}`, // Environment-specific (e.g., .env.production)
    ".env.local", // Local overrides (gitignored)
    `.env.${nodeEnv}.local`, // Environment + local overrides
  ];
}

const envPaths = getEnvPaths();
console.log("Environment-specific paths:", envPaths);

EnvManager.bootstrap({ envPaths, overload: true });

// ============================================================================
// Overload Mode
// ============================================================================

console.log("\n=== Overload Mode ===\n");

// Reset for demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// By default, first file wins (no overload)
// With overload: true, later files override earlier ones

const overloadOptions: EnvManagerOptions = {
  envPaths: [".env", ".env.local"],
  overload: true, // .env.local values override .env values
};

EnvManager.bootstrap(overloadOptions);
console.log("With overload: true, later files take precedence");

// ============================================================================
// Legacy Array Syntax
// ============================================================================

console.log("\n=== Legacy Array Syntax ===\n");

// Reset for demo
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// For backward compatibility, you can pass an array directly
EnvManager.bootstrap([".env", ".env.local"]);
console.log("Legacy syntax: EnvManager.bootstrap(['.env', '.env.local'])");

// ============================================================================
// Monorepo Pattern
// ============================================================================

console.log("\n=== Monorepo Pattern ===\n");

console.log(`
For monorepos, you might load from multiple locations:

const monorepoOptions: EnvManagerOptions = {
  envPaths: [
    "../../.env",           // Root .env
    "../../.env.local",     // Root local overrides
    ".env",                 // Package .env
    ".env.local",           // Package local overrides
  ],
  overload: true,
};
`);
