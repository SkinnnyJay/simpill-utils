/**
 * @simpill/env.utils - Dynamic Mode & Cache Management
 *
 * This example demonstrates how to use dynamic mode for runtime
 * environment variable changes and manual cache refresh.
 *
 * Run: npx ts-node examples/advanced/05-dynamic-mode.ts
 */

import { EnvManager } from "@simpill/env.utils/server";

// ============================================================================
// Default Behavior: Cached Mode
// ============================================================================

console.log("=== Default Cached Mode ===\n");

// Reset for clean state
EnvManager.resetInstance();
EnvManager.resetBootstrap();

// Set initial value
process.env.EXAMPLE_VAR = "initial-value";

// Create manager (default: cached mode)
const cachedManager = EnvManager.getInstance();

console.log(`Initial value: ${cachedManager.getString("EXAMPLE_VAR")}`);
console.log(`Is dynamic: ${cachedManager.isDynamic()}`);
console.log(`Cache size: ${cachedManager.getCacheSize()} entries`);

// Change process.env after initialization
process.env.EXAMPLE_VAR = "changed-value";

// Cached mode doesn't see the change
console.log(`After change (cached): ${cachedManager.getString("EXAMPLE_VAR")}`);
// Output: "initial-value" (still cached)

// ============================================================================
// Dynamic Mode: Real-time process.env Access
// ============================================================================

console.log("\n=== Dynamic Mode ===\n");

// Reset for clean state
EnvManager.resetInstance();

// Set initial value
process.env.DYNAMIC_VAR = "initial";

// Create manager with dynamic mode enabled
const dynamicManager = EnvManager.getInstance({ dynamic: true });

console.log(`Initial value: ${dynamicManager.getString("DYNAMIC_VAR")}`);
console.log(`Is dynamic: ${dynamicManager.isDynamic()}`);

// Change process.env
process.env.DYNAMIC_VAR = "updated-at-runtime";

// Dynamic mode sees the change immediately
console.log(`After change (dynamic): ${dynamicManager.getString("DYNAMIC_VAR")}`);
// Output: "updated-at-runtime"

// Add a new variable at runtime
process.env.NEW_RUNTIME_VAR = "I was added later";
console.log(`New runtime var: ${dynamicManager.getString("NEW_RUNTIME_VAR")}`);
console.log(`Has NEW_RUNTIME_VAR: ${dynamicManager.has("NEW_RUNTIME_VAR")}`);

// Delete a variable
delete process.env.NEW_RUNTIME_VAR;
console.log(`After delete, has NEW_RUNTIME_VAR: ${dynamicManager.has("NEW_RUNTIME_VAR")}`);

// ============================================================================
// Manual Cache Refresh
// ============================================================================

console.log("\n=== Manual Cache Refresh ===\n");

// Reset for clean state
EnvManager.resetInstance();

// Set initial values
process.env.REFRESH_VAR = "before-refresh";

// Create manager in cached mode (default)
const refreshManager = EnvManager.getInstance();

console.log(`Before refresh: ${refreshManager.getString("REFRESH_VAR")}`);
console.log(`Cache size: ${refreshManager.getCacheSize()} entries`);

// Change process.env
process.env.REFRESH_VAR = "after-change";
process.env.BRAND_NEW_VAR = "I am new";

// Still shows old value (cached)
console.log(`After change (before refresh): ${refreshManager.getString("REFRESH_VAR")}`);
console.log(`Has BRAND_NEW_VAR (before refresh): ${refreshManager.has("BRAND_NEW_VAR")}`);

// Refresh the cache
refreshManager.refresh();

// Now shows updated values
console.log(`After refresh: ${refreshManager.getString("REFRESH_VAR")}`);
console.log(`Has BRAND_NEW_VAR (after refresh): ${refreshManager.has("BRAND_NEW_VAR")}`);
console.log(`BRAND_NEW_VAR value: ${refreshManager.getString("BRAND_NEW_VAR")}`);
console.log(`Cache size after refresh: ${refreshManager.getCacheSize()} entries`);

// ============================================================================
// Refresh with Overrides
// ============================================================================

console.log("\n=== Refresh with Overrides ===\n");

// Reset for clean state
EnvManager.resetInstance();

// Create manager with overrides
process.env.OVERRIDE_VAR = "from-process-env";
const overrideManager = EnvManager.getInstance({
  overrides: { OVERRIDE_VAR: "from-override" },
});

console.log(`Initial (override wins): ${overrideManager.getString("OVERRIDE_VAR")}`);

// Change process.env
process.env.OVERRIDE_VAR = "changed-in-process-env";

// Refresh - overrides are reapplied
overrideManager.refresh();

// Override still takes precedence
console.log(`After refresh (override still wins): ${overrideManager.getString("OVERRIDE_VAR")}`);

// ============================================================================
// When to Use Each Mode
// ============================================================================

console.log("\n=== When to Use Each Mode ===\n");

console.log("CACHED MODE (default):");
console.log("  - Best performance (reads from Map)");
console.log("  - Use for: Most applications where env vars are static");
console.log("  - Use refresh() for occasional updates");
console.log("");

console.log("DYNAMIC MODE (dynamic: true):");
console.log("  - Slightly slower (reads from process.env each time)");
console.log("  - Use for: Testing, hot-reloading, runtime config changes");
console.log("  - Use when env vars may change frequently");
console.log("");

console.log("MANUAL REFRESH:");
console.log("  - Best of both worlds");
console.log("  - Use cached mode for performance");
console.log("  - Call refresh() when you know env vars have changed");

// ============================================================================
// Cleanup
// ============================================================================

// Clean up test variables
delete process.env.EXAMPLE_VAR;
delete process.env.DYNAMIC_VAR;
delete process.env.REFRESH_VAR;
delete process.env.BRAND_NEW_VAR;
delete process.env.OVERRIDE_VAR;
delete process.env.NEW_RUNTIME_VAR;

EnvManager.resetInstance();
EnvManager.resetBootstrap();
