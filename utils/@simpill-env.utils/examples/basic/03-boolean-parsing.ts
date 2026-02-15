/**
 * @simpill/env.utils - Boolean Parsing
 *
 * This example demonstrates how boolean environment variables are parsed.
 * Supports common patterns: "true"/"false" and "1"/"0".
 *
 * Run: npx ts-node examples/basic/03-boolean-parsing.ts
 */

import { EnvManager } from "@simpill/env.utils/server";
import { BOOLEAN_FALSY, BOOLEAN_TRUTHY, parseBooleanEnvValue } from "@simpill/env.utils/shared";

EnvManager.bootstrap();
const env = EnvManager.getInstance();

// ============================================================================
// Accepted Boolean Values
// ============================================================================

console.log("=== Boolean Parsing Rules ===\n");

// Truthy values (case-insensitive)
console.log("Truthy values:");
console.log(`  "true"  -> ${parseBooleanEnvValue("true", false)}`);
console.log(`  "TRUE"  -> ${parseBooleanEnvValue("TRUE", false)}`);
console.log(`  "True"  -> ${parseBooleanEnvValue("True", false)}`);
console.log(`  "1"     -> ${parseBooleanEnvValue("1", false)}`);

// Falsy values (case-insensitive)
console.log("\nFalsy values:");
console.log(`  "false" -> ${parseBooleanEnvValue("false", true)}`);
console.log(`  "FALSE" -> ${parseBooleanEnvValue("FALSE", true)}`);
console.log(`  "False" -> ${parseBooleanEnvValue("False", true)}`);
console.log(`  "0"     -> ${parseBooleanEnvValue("0", true)}`);

// Invalid values fall back to default
console.log("\nInvalid values (fall back to default):");
console.log(`  "yes"   -> ${parseBooleanEnvValue("yes", false)} (default: false)`);
console.log(`  "no"    -> ${parseBooleanEnvValue("no", true)} (default: true)`);
console.log(`  "on"    -> ${parseBooleanEnvValue("on", false)} (default: false)`);
console.log(`  "off"   -> ${parseBooleanEnvValue("off", true)} (default: true)`);
console.log(`  ""      -> ${parseBooleanEnvValue("", false)} (default: false)`);

// ============================================================================
// Using Constants for Clarity
// ============================================================================

console.log("\n=== Using Constants ===\n");

// The shared module exports constants for truthy/falsy values
console.log("BOOLEAN_TRUTHY:", BOOLEAN_TRUTHY);
console.log("BOOLEAN_FALSY:", BOOLEAN_FALSY);

// Use these when setting env vars programmatically
process.env.MY_FLAG = BOOLEAN_TRUTHY.TRUE;
console.log(`\nSet MY_FLAG to "${BOOLEAN_TRUTHY.TRUE}"`);
console.log(`Reading MY_FLAG: ${env.getBoolean("MY_FLAG", false)}`);

// ============================================================================
// Feature Flags Pattern
// ============================================================================

console.log("\n=== Feature Flags Pattern ===\n");

interface FeatureFlags {
  darkMode: boolean;
  analytics: boolean;
  betaFeatures: boolean;
  legacySupport: boolean;
}

function loadFeatureFlags(): FeatureFlags {
  return {
    darkMode: env.getBoolean("FEATURE_DARK_MODE", false),
    analytics: env.getBoolean("FEATURE_ANALYTICS", true),
    betaFeatures: env.getBoolean("FEATURE_BETA", false),
    legacySupport: env.getBoolean("FEATURE_LEGACY", true),
  };
}

const flags = loadFeatureFlags();
console.log("Feature Flags:", flags);

// Conditional logic based on flags
if (flags.darkMode) {
  console.log("  -> Dark mode is enabled");
}
if (flags.analytics) {
  console.log("  -> Analytics tracking is active");
}
if (flags.betaFeatures) {
  console.log("  -> Beta features are available");
}
