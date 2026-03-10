/**
 * @simpill/env.utils - Multiple .env Files
 *
 * This example demonstrates loading multiple .env files with different
 * strategies for handling conflicts and environment-specific configuration.
 *
 * Run: npx ts-node examples/advanced/02-multiple-env-files.ts
 */

import { EnvManager, type EnvManagerOptions } from "@simpill/env.utils/server";
import { DEFAULT_ENV_PATHS } from "@simpill/env.utils/shared";

// ============================================================================
// Default Loading Strategy
// ============================================================================

console.log("=== Default Loading Strategy ===\n");

console.log("Default paths:", DEFAULT_ENV_PATHS);
console.log("  ['.env.local', '.env']");
console.log("\nDefault behavior (overload: false):");
console.log("  - First file's values win");
console.log("  - .env.local takes precedence over .env");
console.log("  - Good for: local development overrides");

// ============================================================================
// Overload Strategy
// ============================================================================

console.log("\n=== Overload Strategy ===\n");

EnvManager.resetInstance();
EnvManager.resetBootstrap();

const overloadOptions: EnvManagerOptions = {
  envPaths: [".env", ".env.local"],
  overload: true,
};

EnvManager.bootstrap(overloadOptions);

console.log("With overload: true");
console.log("  - Later files override earlier files");
console.log("  - .env.local overrides .env");
console.log("  - Good for: layered configuration");

// ============================================================================
// Environment-Specific Files
// ============================================================================

console.log("\n=== Environment-Specific Files ===\n");

EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Determine current environment
const nodeEnv = process.env.NODE_ENV ?? "development";
console.log(`Current NODE_ENV: ${nodeEnv}`);

// Build environment-specific path list
const envSpecificPaths: readonly string[] = [
  ".env", // Base defaults
  `.env.${nodeEnv}`, // Environment-specific
  ".env.local", // Local overrides (gitignored)
  `.env.${nodeEnv}.local`, // Environment + local
];

console.log("\nEnvironment-specific paths:");
for (const [i, p] of envSpecificPaths.entries()) {
  console.log(`  ${i + 1}. ${p}`);
}

EnvManager.bootstrap({
  envPaths: envSpecificPaths,
  overload: true,
});

// ============================================================================
// Monorepo Configuration
// ============================================================================

console.log("\n=== Monorepo Configuration ===\n");

EnvManager.resetInstance();
EnvManager.resetBootstrap();

// In a monorepo, you might load from multiple locations
const monorepoPaths: readonly string[] = [
  "../../.env", // Root .env
  "../../.env.local", // Root local
  ".env", // Package .env
  ".env.local", // Package local
];

console.log("Monorepo paths (from package directory):");
for (const [i, p] of monorepoPaths.entries()) {
  console.log(`  ${i + 1}. ${p}`);
}

console.log("\nThis allows:");
console.log("  - Shared configuration at root level");
console.log("  - Package-specific overrides");
console.log("  - Local development overrides at both levels");

// ============================================================================
// CI/CD Configuration
// ============================================================================

console.log("\n=== CI/CD Configuration ===\n");

EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Different strategies for CI/CD environments
function getCiCdPaths(): readonly string[] {
  const isCI = process.env.CI === "true";
  const environment = process.env.DEPLOY_ENV ?? "staging";

  if (isCI) {
    // In CI, only load environment-specific files
    // (secrets come from CI environment variables)
    return [`.env.${environment}`];
  }

  // Local development
  return [".env", ".env.local"];
}

const cicdPaths = getCiCdPaths();
console.log("CI/CD paths:", cicdPaths);

// ============================================================================
// Secrets Management
// ============================================================================

console.log("\n=== Secrets Management Pattern ===\n");

EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Separate secrets from configuration
const secretsPaths: readonly string[] = [
  ".env", // Non-sensitive defaults
  ".env.secrets", // Sensitive values (gitignored)
  ".env.local", // Local overrides
];

console.log("Secrets separation:");
for (const p of secretsPaths) {
  console.log(`  - ${p}`);
}

console.log("\nRecommended .gitignore:");
console.log("  .env.local");
console.log("  .env.secrets");
console.log("  .env.*.local");
console.log("  .env.production");

// ============================================================================
// Validation After Loading
// ============================================================================

console.log("\n=== Validation After Loading ===\n");

EnvManager.resetInstance();
EnvManager.resetBootstrap();

EnvManager.bootstrap();
const env = EnvManager.getInstance();

// Validate required variables after loading
const requiredVars = ["DATABASE_URL", "API_KEY", "JWT_SECRET"];
const missingVars = requiredVars.filter((v) => !env.has(v));

if (missingVars.length > 0) {
  console.log(`Missing required variables: ${missingVars.join(", ")}`);
  console.log("(This is expected in the example - no .env files loaded)");
} else {
  console.log("All required variables are set!");
}
