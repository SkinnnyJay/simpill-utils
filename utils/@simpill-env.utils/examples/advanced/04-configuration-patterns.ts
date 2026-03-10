/**
 * @simpill/env.utils - Configuration Patterns
 *
 * This example demonstrates common patterns for building type-safe
 * configuration objects from environment variables.
 *
 * Run: npx ts-node examples/advanced/04-configuration-patterns.ts
 */

import { Env, EnvManager } from "@simpill/env.utils/server";
import { NODE_ENV, type NodeEnvValue } from "@simpill/env.utils/shared";

EnvManager.bootstrap();
const envManager = EnvManager.getInstance();
const env = new Env(envManager);

// ============================================================================
// Typed Configuration Objects
// ============================================================================

console.log("=== Typed Configuration Objects ===\n");

// Define strict interfaces for your configuration
interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly ssl: boolean;
  readonly poolSize: number;
}

interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly env: NodeEnvValue;
  readonly debug: boolean;
}

interface AppConfig {
  readonly name: string;
  readonly version: string;
  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
}

// Factory functions for each config section
function loadServerConfig(): ServerConfig {
  return {
    host: env.getString("HOST", "0.0.0.0"),
    port: env.getNumber("PORT", 3000),
    env: envManager.getEnvironment() as NodeEnvValue,
    debug: env.getBoolean("DEBUG_MODE", false),
  };
}

function loadDatabaseConfig(): DatabaseConfig {
  return {
    host: env.getString("DB_HOST", "localhost"),
    port: env.getNumber("DB_PORT", 5432),
    database: env.getString("DB_NAME", "app"),
    username: env.getString("DB_USER", "postgres"),
    password: env.getString("DB_PASSWORD", ""),
    ssl: env.getBoolean("DB_SSL", true),
    poolSize: env.getNumber("DB_POOL_SIZE", 10),
  };
}

function loadAppConfig(): AppConfig {
  return {
    name: env.getString("APP_NAME", "my-app"),
    version: env.getString("APP_VERSION", "0.0.0"),
    server: loadServerConfig(),
    database: loadDatabaseConfig(),
  };
}

const config = loadAppConfig();
console.log("App Configuration:");
console.log(JSON.stringify(config, null, 2));

// ============================================================================
// Singleton Config Pattern
// ============================================================================

console.log("\n=== Singleton Config Pattern ===\n");

// Create a singleton configuration that's loaded once
class Config {
  private static instance: Config | null = null;

  public readonly app: AppConfig;

  private constructor() {
    this.app = loadAppConfig();
    Object.freeze(this.app);
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public static reset(): void {
    Config.instance = null;
  }
}

const singletonConfig = Config.getInstance();
console.log(`App name from singleton: ${singletonConfig.app.name}`);

// ============================================================================
// Validation Pattern
// ============================================================================

console.log("\n=== Validation Pattern ===\n");

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateConfig(config: AppConfig): ValidationResult {
  const errors: string[] = [];

  // Server validation
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push(`Invalid port: ${config.server.port}`);
  }

  // Database validation
  if (!config.database.host) {
    errors.push("Database host is required");
  }
  if (config.database.poolSize < 1) {
    errors.push(`Invalid pool size: ${config.database.poolSize}`);
  }

  // Production-specific validation
  if (config.server.env === NODE_ENV.PRODUCTION) {
    if (!config.database.password) {
      errors.push("Database password required in production");
    }
    if (!config.database.ssl) {
      errors.push("SSL should be enabled in production");
    }
    if (config.server.debug) {
      errors.push("Debug mode should be disabled in production");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

const validation = validateConfig(config);
console.log(`Config valid: ${validation.valid}`);
if (!validation.valid) {
  console.log("Validation errors:");
  for (const e of validation.errors) {
    console.log(`  - ${e}`);
  }
}

// ============================================================================
// Environment-Specific Defaults
// ============================================================================

console.log("\n=== Environment-Specific Defaults ===\n");

interface EnvDefaults {
  logLevel: string;
  cacheEnabled: boolean;
  cacheTtl: number;
  rateLimitEnabled: boolean;
  maxRequestsPerMinute: number;
}

function getEnvDefaults(nodeEnv: string): EnvDefaults {
  switch (nodeEnv) {
    case NODE_ENV.PRODUCTION:
      return {
        logLevel: "error",
        cacheEnabled: true,
        cacheTtl: 3600,
        rateLimitEnabled: true,
        maxRequestsPerMinute: 100,
      };
    case NODE_ENV.STAGING:
      return {
        logLevel: "warn",
        cacheEnabled: true,
        cacheTtl: 300,
        rateLimitEnabled: true,
        maxRequestsPerMinute: 500,
      };
    case NODE_ENV.TEST:
      return {
        logLevel: "silent",
        cacheEnabled: false,
        cacheTtl: 0,
        rateLimitEnabled: false,
        maxRequestsPerMinute: 10000,
      };
    default: // development
      return {
        logLevel: "debug",
        cacheEnabled: false,
        cacheTtl: 60,
        rateLimitEnabled: false,
        maxRequestsPerMinute: 10000,
      };
  }
}

const defaults = getEnvDefaults(envManager.getEnvironment());
console.log(`Defaults for ${envManager.getEnvironment()}:`);
console.log(JSON.stringify(defaults, null, 2));

// ============================================================================
// Feature Flags Pattern
// ============================================================================

console.log("\n=== Feature Flags Pattern ===\n");

interface FeatureFlags {
  readonly [key: string]: boolean;
}

function loadFeatureFlags(prefix = "FF_"): FeatureFlags {
  const flags: Record<string, boolean> = {};

  // Load all environment variables with the prefix
  // In practice, you'd define these explicitly
  const knownFlags = ["DARK_MODE", "NEW_DASHBOARD", "BETA_API", "ANALYTICS", "EXPERIMENTAL"];

  for (const flag of knownFlags) {
    const key = `${prefix}${flag}`;
    flags[flag.toLowerCase().replace(/_/g, "")] = env.getBoolean(key, false);
  }

  return Object.freeze(flags);
}

const featureFlags = loadFeatureFlags();
console.log("Feature Flags:", featureFlags);

// Usage
function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag] ?? false;
}

console.log(`Dark mode enabled: ${isFeatureEnabled("darkmode")}`);
