/**
 * @simpill/env.utils - Env Class Wrapper
 *
 * This example demonstrates the Env class, which provides a cleaner
 * interface when you want to inject the environment manager as a dependency.
 *
 * Run: npx ts-node examples/server/02-env-class-wrapper.ts
 */

import { Env, EnvManager } from "@simpill/env.utils/server";

EnvManager.bootstrap();

// ============================================================================
// Using the Env Class
// ============================================================================

// Create an Env instance wrapping the EnvManager
const env = new Env(EnvManager.getInstance());

// The Env class provides the same type-safe getters
const appName = env.getString("APP_NAME", "my-app");
const port = env.getNumber("PORT", 3000);
const debug = env.getBoolean("DEBUG_MODE", false);

console.log("=== Env Class Usage ===\n");
console.log(`App: ${appName}`);
console.log(`Port: ${port}`);
console.log(`Debug: ${debug}`);

// ============================================================================
// Dependency Injection Pattern
// ============================================================================

console.log("\n=== Dependency Injection Pattern ===\n");

// The Env class is useful for dependency injection
// This makes your code more testable

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
}

class DatabaseService {
  private readonly config: DatabaseConfig;

  constructor(env: Env) {
    // Load configuration from environment
    this.config = {
      host: env.getString("DB_HOST", "localhost"),
      port: env.getNumber("DB_PORT", 5432),
      database: env.getString("DB_NAME", "mydb"),
      ssl: env.getBoolean("DB_SSL", true),
    };
  }

  public getConfig(): DatabaseConfig {
    return this.config;
  }

  public connect(): void {
    console.log(`Connecting to ${this.config.host}:${this.config.port}/${this.config.database}`);
    console.log(`SSL: ${this.config.ssl ? "enabled" : "disabled"}`);
  }
}

// In production code
const dbService = new DatabaseService(env);
dbService.connect();
console.log("Config:", dbService.getConfig());

// ============================================================================
// Testing Pattern
// ============================================================================

console.log("\n=== Testing Pattern ===\n");

// For testing, you can create a mock Env or use EnvManager with overrides
// This example shows how the pattern enables easy testing

// In tests, you might create a mock that returns controlled values:
// class MockEnvManager extends EnvManager { ... }
// Or use EnvManager's override feature (shown in advanced examples)
console.log("See advanced examples for testing patterns with overrides");

// ============================================================================
// Service Factory Pattern
// ============================================================================

console.log("\n=== Service Factory Pattern ===\n");

interface ServiceConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

function createServiceConfig(env: Env): ServiceConfig {
  return {
    apiUrl: env.getString("API_URL", "http://localhost:8080"),
    timeout: env.getNumber("API_TIMEOUT_MS", 5000),
    retries: env.getNumber("API_RETRIES", 3),
    debug: env.getBoolean("API_DEBUG", false),
  };
}

const serviceConfig = createServiceConfig(env);
console.log("Service Config:", JSON.stringify(serviceConfig, null, 2));
