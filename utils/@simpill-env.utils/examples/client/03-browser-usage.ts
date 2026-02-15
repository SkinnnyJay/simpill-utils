/**
 * @simpill/env.utils - Browser Usage
 *
 * This example shows how to use the client utilities in browser environments.
 * Note: In browsers, only PUBLIC environment variables are available
 * (those prefixed with NEXT_PUBLIC_ in Next.js, for example).
 *
 * This is a conceptual example for browser/React code.
 */

import {
  getEdgeBoolean,
  getEdgeNumber,
  getEdgeString,
  hasEdgeEnv,
} from "@simpill/env.utils/client";

// ============================================================================
// Browser Environment Variables
// ============================================================================

console.log("=== Browser Environment Variables ===\n");

console.log("Important: In browsers, only PUBLIC env vars are available!");
console.log("  - Next.js: NEXT_PUBLIC_* variables");
console.log("  - Vite: VITE_* variables");
console.log("  - Create React App: REACT_APP_* variables");
console.log("\nThese are embedded at build time, not runtime.");

// ============================================================================
// Next.js Public Variables Pattern
// ============================================================================

console.log("\n=== Next.js Public Variables ===\n");

interface PublicConfig {
  apiUrl: string;
  appName: string;
  analyticsId: string;
  debugMode: boolean;
}

function loadPublicConfig(): PublicConfig {
  return {
    // In Next.js, these would be NEXT_PUBLIC_* variables
    apiUrl: getEdgeString("NEXT_PUBLIC_API_URL", "https://api.example.com"),
    appName: getEdgeString("NEXT_PUBLIC_APP_NAME", "My App"),
    analyticsId: getEdgeString("NEXT_PUBLIC_ANALYTICS_ID", ""),
    debugMode: getEdgeBoolean("NEXT_PUBLIC_DEBUG", false),
  };
}

const publicConfig = loadPublicConfig();
console.log("Public Config:", JSON.stringify(publicConfig, null, 2));

// ============================================================================
// React Component Pattern
// ============================================================================

console.log("\n=== React Component Pattern ===\n");

console.log(`
// In a React component:

import { getEdgeString, getEdgeBoolean } from "@simpill/env.utils/client";

function ApiClient() {
  // Safe to use in client components!
  const apiUrl = getEdgeString("NEXT_PUBLIC_API_URL", "/api");
  const debugMode = getEdgeBoolean("NEXT_PUBLIC_DEBUG", false);

  const fetchData = async () => {
    const response = await fetch(\`\${apiUrl}/data\`);
    if (debugMode) {
      console.log("API Response:", response);
    }
    return response.json();
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
`);

// ============================================================================
// Analytics Configuration
// ============================================================================

console.log("\n=== Analytics Configuration ===\n");

interface AnalyticsConfig {
  enabled: boolean;
  trackingId: string;
  debugMode: boolean;
  sampleRate: number;
}

function loadAnalyticsConfig(): AnalyticsConfig {
  return {
    enabled: getEdgeBoolean("NEXT_PUBLIC_ANALYTICS_ENABLED", true),
    trackingId: getEdgeString("NEXT_PUBLIC_GA_ID", ""),
    debugMode: getEdgeBoolean("NEXT_PUBLIC_ANALYTICS_DEBUG", false),
    sampleRate: getEdgeNumber("NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE", 100),
  };
}

const analyticsConfig = loadAnalyticsConfig();
console.log("Analytics Config:", JSON.stringify(analyticsConfig, null, 2));

// Conditional initialization
if (analyticsConfig.enabled && analyticsConfig.trackingId) {
  console.log(`Would initialize analytics with ID: ${analyticsConfig.trackingId}`);
} else {
  console.log("Analytics disabled or no tracking ID configured");
}

// ============================================================================
// Security Considerations
// ============================================================================

console.log("\n=== Security Considerations ===\n");

console.log("NEVER expose sensitive data in public env vars:");
console.log("  - API keys / secrets");
console.log("  - Database credentials");
console.log("  - JWT secrets");
console.log("  - Private keys");

console.log("\nSafe for public env vars:");
console.log("  - Public API URLs");
console.log("  - App name / version");
console.log("  - Analytics IDs (they're public anyway)");
console.log("  - Feature flags (non-sensitive)");
console.log("  - Public configuration");

// Check for common mistakes
const hasSecret = hasEdgeEnv("NEXT_PUBLIC_SECRET");
const hasApiKey = hasEdgeEnv("NEXT_PUBLIC_API_KEY");

if (hasSecret || hasApiKey) {
  console.warn("\nWarning: Potentially sensitive data in public env vars!");
}
