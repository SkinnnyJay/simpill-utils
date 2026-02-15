/**
 * @simpill/env.utils - Edge Runtime Basics
 *
 * This example demonstrates the client/edge utilities for environments
 * that don't have access to the file system (Edge Runtime, browsers, etc.).
 *
 * These functions read directly from process.env without loading .env files.
 *
 * Run: npx ts-node examples/client/01-edge-runtime-basics.ts
 */

import {
  getEdgeBoolean,
  getEdgeEnv,
  getEdgeNumber,
  getEdgeString,
  hasEdgeEnv,
  isEdgeDev,
  isEdgeProd,
} from "@simpill/env.utils/client";

// ============================================================================
// Edge Runtime Limitations
// ============================================================================

console.log("=== Edge Runtime Context ===\n");

console.log("Edge Runtime (Vercel Edge, Cloudflare Workers, etc.) has limitations:");
console.log("  - No file system access (can't read .env files)");
console.log("  - No Node.js APIs like fs, path, process.cwd()");
console.log("  - Only process.env is available (set at build/deploy time)");
console.log("\nThe client utilities work within these constraints.");

// ============================================================================
// Basic Value Access
// ============================================================================

console.log("\n=== Reading Values ===\n");

// String values
const apiUrl = getEdgeString("API_URL", "https://api.example.com");
const appName = getEdgeString("APP_NAME", "my-edge-app");
console.log(`API URL: ${apiUrl}`);
console.log(`App Name: ${appName}`);

// Number values
const timeout = getEdgeNumber("TIMEOUT_MS", 5000);
const maxRetries = getEdgeNumber("MAX_RETRIES", 3);
console.log(`Timeout: ${timeout}ms`);
console.log(`Max Retries: ${maxRetries}`);

// Boolean values
const debug = getEdgeBoolean("DEBUG_MODE", false);
const analytics = getEdgeBoolean("FEATURE_ANALYTICS", true);
console.log(`Debug: ${debug}`);
console.log(`Analytics: ${analytics}`);

// ============================================================================
// Generic getEdgeEnv Function
// ============================================================================

console.log("\n=== Generic getEdgeEnv ===\n");

// getEdgeEnv infers the type from the default value
const stringVal = getEdgeEnv("CONFIG_STRING", "default"); // string
const numberVal = getEdgeEnv("CONFIG_NUMBER", 42); // number
const boolVal = getEdgeEnv("CONFIG_BOOL", true); // boolean

console.log(`String: ${stringVal} (type: ${typeof stringVal})`);
console.log(`Number: ${numberVal} (type: ${typeof numberVal})`);
console.log(`Boolean: ${boolVal} (type: ${typeof boolVal})`);

// ============================================================================
// Checking Variable Existence
// ============================================================================

console.log("\n=== Checking Existence ===\n");

const hasApiKey = hasEdgeEnv("API_KEY");
const hasMissing = hasEdgeEnv("DEFINITELY_NOT_SET");

console.log(`Has API_KEY: ${hasApiKey}`);
console.log(`Has DEFINITELY_NOT_SET: ${hasMissing}`);

// ============================================================================
// Environment Detection
// ============================================================================

console.log("\n=== Environment Detection ===\n");

const isProd = isEdgeProd();
const isDev = isEdgeDev();

console.log(`Is Production: ${isProd}`);
console.log(`Is Development: ${isDev}`);

// Common pattern: conditional logic
if (isEdgeProd()) {
  console.log("Running in production - using production settings");
} else if (isEdgeDev()) {
  console.log("Running in development - using dev settings");
} else {
  console.log("Running in other environment (test, staging, etc.)");
}

// ============================================================================
// When to Use Client vs Server
// ============================================================================

console.log("\n=== Client vs Server ===\n");

console.log("Use @simpill/env.utils/client when:");
console.log("  - Running in Edge Runtime (Vercel Edge Functions)");
console.log("  - Running in Cloudflare Workers");
console.log("  - Running in browser (client-side code)");
console.log("  - Running in Next.js middleware");
console.log("  - Environment variables are set at build/deploy time");

console.log("\nUse @simpill/env.utils/server when:");
console.log("  - Running in Node.js");
console.log("  - Need to load .env files");
console.log("  - Running in API routes (not Edge)");
console.log("  - Running in server components");
