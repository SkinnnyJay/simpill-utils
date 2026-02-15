/**
 * @simpill/env.utils - Next.js Middleware Example
 *
 * This example shows how to use the client utilities in Next.js middleware,
 * which runs in Edge Runtime and cannot use Node.js APIs.
 *
 * This is a conceptual example - copy the pattern to your middleware.ts file.
 */

import { getEdgeBoolean, getEdgeString, isEdgeProd } from "@simpill/env.utils/client";

// ============================================================================
// Next.js Middleware Pattern
// ============================================================================

/**
 * Example middleware configuration using edge-safe env utilities.
 *
 * In your actual middleware.ts:
 *
 * ```typescript
 * import { NextResponse } from "next/server";
 * import type { NextRequest } from "next/server";
 * import { getEdgeString, getEdgeBoolean, isEdgeProd } from "@simpill/env.utils/client";
 *
 * export function middleware(request: NextRequest) {
 *   // Safe to use in Edge Runtime!
 *   const apiUrl = getEdgeString("API_URL", "https://api.example.com");
 *   const maintenanceMode = getEdgeBoolean("MAINTENANCE_MODE", false);
 *
 *   if (maintenanceMode) {
 *     return NextResponse.redirect(new URL("/maintenance", request.url));
 *   }
 *
 *   // Add API URL to headers for downstream use
 *   const response = NextResponse.next();
 *   response.headers.set("x-api-url", apiUrl);
 *   return response;
 * }
 * ```
 */

// ============================================================================
// Simulated Middleware Logic
// ============================================================================

console.log("=== Next.js Middleware Pattern ===\n");

interface MiddlewareConfig {
  apiUrl: string;
  maintenanceMode: boolean;
  rateLimitEnabled: boolean;
  maxRequestsPerMinute: number;
  allowedOrigins: string;
}

function loadMiddlewareConfig(): MiddlewareConfig {
  return {
    apiUrl: getEdgeString("API_URL", "https://api.example.com"),
    maintenanceMode: getEdgeBoolean("MAINTENANCE_MODE", false),
    rateLimitEnabled: getEdgeBoolean("RATE_LIMIT_ENABLED", true),
    maxRequestsPerMinute: 100, // Note: getEdgeNumber would be used here
    allowedOrigins: getEdgeString("ALLOWED_ORIGINS", "*"),
  };
}

const config = loadMiddlewareConfig();
console.log("Middleware Config:", JSON.stringify(config, null, 2));

// ============================================================================
// Auth Middleware Pattern
// ============================================================================

console.log("\n=== Auth Middleware Pattern ===\n");

interface AuthConfig {
  jwtSecret: string;
  sessionCookieName: string;
  secureCookies: boolean;
  authEnabled: boolean;
}

function loadAuthConfig(): AuthConfig {
  return {
    jwtSecret: getEdgeString("JWT_SECRET", ""),
    sessionCookieName: getEdgeString("SESSION_COOKIE", "session"),
    secureCookies: isEdgeProd(), // Secure cookies in production
    authEnabled: getEdgeBoolean("AUTH_ENABLED", true),
  };
}

const authConfig = loadAuthConfig();
console.log("Auth Config:", JSON.stringify(authConfig, null, 2));

// Validate required config
if (!authConfig.jwtSecret && authConfig.authEnabled) {
  console.warn("Warning: JWT_SECRET not set but auth is enabled!");
}

// ============================================================================
// Feature Flag Middleware
// ============================================================================

console.log("\n=== Feature Flag Middleware ===\n");

interface FeatureFlags {
  newDashboard: boolean;
  betaApi: boolean;
  experimentalFeatures: boolean;
}

function loadFeatureFlags(): FeatureFlags {
  return {
    newDashboard: getEdgeBoolean("FF_NEW_DASHBOARD", false),
    betaApi: getEdgeBoolean("FF_BETA_API", false),
    experimentalFeatures: getEdgeBoolean("FF_EXPERIMENTAL", false),
  };
}

const flags = loadFeatureFlags();
console.log("Feature Flags:", flags);

// Example: Route to different versions based on flags
function getRouteVersion(path: string, flags: FeatureFlags): string {
  if (path.startsWith("/dashboard") && flags.newDashboard) {
    return path.replace("/dashboard", "/dashboard-v2");
  }
  if (path.startsWith("/api") && flags.betaApi) {
    return path.replace("/api", "/api/beta");
  }
  return path;
}

console.log("\nRoute transformations:");
console.log(`  /dashboard -> ${getRouteVersion("/dashboard", flags)}`);
console.log(`  /api/users -> ${getRouteVersion("/api/users", flags)}`);
