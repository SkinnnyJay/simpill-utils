/**
 * @simpill/env.utils - Process.env Extension
 *
 * This example demonstrates extending process.env with type-safe getters.
 * By default, EnvManager.bootstrap() automatically extends process.env.
 *
 * Run: npx ts-node examples/server/03-process-env-extension.ts
 */

import { EnvManager } from "@simpill/env.utils/server";

// Bootstrap with default options - process.env is extended automatically
EnvManager.bootstrap();

// Or explicitly enable/disable with the extendProcessEnv option:
// EnvManager.bootstrap({ extendProcessEnv: true });  // default behavior
// EnvManager.bootstrap({ extendProcessEnv: false }); // opt out

// ============================================================================
// Using Extended process.env
// ============================================================================

console.log("=== Extended process.env ===\n");

// process.env getters are added at runtime. TypeScript does not know about them
// unless you use declaration merging (see process-env.d.ts in the package).
// Prefer: import { Env } from "@simpill/env.utils"; Env.getString("APP_NAME", "default");
// so you get full type support without @ts-expect-error.

// @ts-expect-error - Methods added at runtime; use Env class or extend ProcessEnv in env.d.ts to remove
const appName = process.env.getString("APP_NAME", "default");
console.log(`App Name: ${appName}`);

// @ts-expect-error - Methods added at runtime; use Env class or extend ProcessEnv in env.d.ts to remove
const port = process.env.getNumber("PORT", 3000);
console.log(`Port: ${port}`);

// @ts-expect-error - Methods added at runtime; use Env class or extend ProcessEnv in env.d.ts to remove
const debug = process.env.getBoolean("DEBUG_MODE", false);
console.log(`Debug: ${debug}`);

// @ts-expect-error - Methods added at runtime; use Env class or extend ProcessEnv in env.d.ts to remove
const hasApiKey = process.env.has("API_KEY");
console.log(`Has API_KEY: ${hasApiKey}`);

// ============================================================================
// Available Extended Methods
// ============================================================================

console.log("\n=== Available Methods ===\n");

console.log("process.env.getString(key, default)  - Get string value");
console.log("process.env.getNumber(key, default)  - Get number value");
console.log("process.env.getBoolean(key, default) - Get boolean value");
console.log("process.env.has(key)                 - Check if key exists");
console.log("process.env.getEnv(key, default)     - Alias for getString");

// ============================================================================
// Opting Out of process.env Extension
// ============================================================================

console.log("\n=== Opting Out ===\n");

console.log("To disable process.env extension:");
console.log("  EnvManager.bootstrap({ extendProcessEnv: false });");
console.log("\nUse cases for opting out:");
console.log("  - Testing environments where you want isolation");
console.log("  - Libraries that should not modify globals");
console.log("  - Projects with strict global mutation policies");

// ============================================================================
// When to Use This Pattern
// ============================================================================

console.log("\n=== When to Use ===\n");

console.log("Pros:");
console.log("  - Familiar process.env syntax");
console.log("  - Quick migration from raw process.env");
console.log("  - No need to import EnvManager everywhere");
console.log("  - Enabled by default for convenience");

console.log("\nCons:");
console.log("  - Modifies global object");
console.log("  - TypeScript types may not reflect added methods");
console.log("  - Less explicit about dependencies");

console.log("\nRecommendation:");
console.log("  - Use default (extended) for application code");
console.log("  - Use { extendProcessEnv: false } for libraries");

// ============================================================================
// Type Declaration (for TypeScript projects)
// ============================================================================

console.log("\n=== TypeScript Declaration ===\n");

console.log(`
Add this to your project's type declarations (e.g., env.d.ts):

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      getString(key: string, defaultValue?: string): string;
      getNumber(key: string, defaultValue?: number): number;
      getBoolean(key: string, defaultValue?: boolean): boolean;
      has(key: string): boolean;
      getEnv(key: string, defaultValue: string): string;
    }
  }
}
`);
