/**
 * @simpill/env.utils - Testing Patterns
 *
 * This example demonstrates best practices for testing code that
 * depends on environment variables.
 *
 * Run: npx ts-node examples/advanced/03-testing-patterns.ts
 */

import { Env, EnvManager } from "@simpill/env.utils/server";

// ============================================================================
// Reset Between Tests
// ============================================================================

console.log("=== Reset Between Tests ===\n");

// IMPORTANT: Always reset between tests to ensure isolation
function resetEnvManager(): void {
  EnvManager.resetInstance();
  EnvManager.resetBootstrap();
}

// Example test setup - these functions demonstrate the pattern
// In actual tests, you'd use Jest/Vitest's beforeEach/afterEach
function exampleBeforeEach(): void {
  resetEnvManager();
}

function exampleAfterEach(): void {
  resetEnvManager();
}

// Demonstrate usage
exampleBeforeEach();
exampleAfterEach();

console.log("Jest/Vitest pattern:");
console.log(`
beforeEach(() => {
  EnvManager.resetInstance();
  EnvManager.resetBootstrap();
});

afterEach(() => {
  EnvManager.resetInstance();
  EnvManager.resetBootstrap();
});
`);

// ============================================================================
// Using Overrides for Tests
// ============================================================================

console.log("\n=== Using Overrides for Tests ===\n");

interface TestCase {
  name: string;
  overrides: Record<string, string>;
  expected: { port: number; debug: boolean };
}

const testCases: TestCase[] = [
  {
    name: "default configuration",
    overrides: {},
    expected: { port: 3000, debug: false },
  },
  {
    name: "production configuration",
    overrides: { PORT: "8080", DEBUG_MODE: "false", NODE_ENV: "production" },
    expected: { port: 8080, debug: false },
  },
  {
    name: "debug mode enabled",
    overrides: { DEBUG_MODE: "true" },
    expected: { port: 3000, debug: true },
  },
];

for (const testCase of testCases) {
  resetEnvManager();

  EnvManager.bootstrap({ overrides: testCase.overrides });
  const env = EnvManager.getInstance({ overrides: testCase.overrides });

  const actual = {
    port: env.getNumber("PORT", 3000),
    debug: env.getBoolean("DEBUG_MODE", false),
  };

  const passed = actual.port === testCase.expected.port && actual.debug === testCase.expected.debug;

  console.log(`Test: ${testCase.name}`);
  console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
  console.log(`  Actual:   ${JSON.stringify(actual)}`);
  console.log(`  Result:   ${passed ? "PASS" : "FAIL"}`);
}

// ============================================================================
// Dependency Injection Pattern
// ============================================================================

console.log("\n=== Dependency Injection Pattern ===\n");

// Service that depends on environment configuration
class ConfigurableService {
  private readonly apiUrl: string;
  private readonly timeout: number;
  private readonly debug: boolean;

  constructor(env: Env) {
    this.apiUrl = env.getString("API_URL", "http://localhost");
    this.timeout = env.getNumber("TIMEOUT_MS", 5000);
    this.debug = env.getBoolean("DEBUG_MODE", false);
  }

  public getConfig() {
    return {
      apiUrl: this.apiUrl,
      timeout: this.timeout,
      debug: this.debug,
    };
  }
}

// Test with different configurations
function testServiceWithConfig(overrides: Record<string, string>): void {
  resetEnvManager();
  EnvManager.bootstrap({ overrides });
  const env = new Env(EnvManager.getInstance({ overrides }));
  const service = new ConfigurableService(env);
  console.log(`Config: ${JSON.stringify(service.getConfig())}`);
}

console.log("Testing service with different configs:");
testServiceWithConfig({ API_URL: "https://api.prod.com", TIMEOUT_MS: "10000" });
testServiceWithConfig({ API_URL: "http://localhost:8080", DEBUG_MODE: "true" });

// ============================================================================
// Mocking Pattern
// ============================================================================

console.log("\n=== Mocking Pattern ===\n");

// For more complex mocking, you can create a mock EnvManager
class MockEnv {
  private readonly values: Map<string, string>;

  constructor(values: Record<string, string>) {
    this.values = new Map(Object.entries(values));
  }

  getString(key: string, defaultValue = ""): string {
    return this.values.get(key) ?? defaultValue;
  }

  getNumber(key: string, defaultValue = 0): number {
    const value = this.values.get(key);
    if (value === undefined) return defaultValue;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.values.get(key)?.toLowerCase();
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return defaultValue;
  }
}

// Use mock in tests
const mockEnv = new MockEnv({
  API_URL: "https://mock.api.com",
  PORT: "9999",
  DEBUG_MODE: "true",
});

console.log("Mock env values:");
console.log(`  API_URL: ${mockEnv.getString("API_URL")}`);
console.log(`  PORT: ${mockEnv.getNumber("PORT")}`);
console.log(`  DEBUG_MODE: ${mockEnv.getBoolean("DEBUG_MODE")}`);

// ============================================================================
// Using refresh() for Dynamic Tests
// ============================================================================

console.log("\n=== Using refresh() for Dynamic Tests ===\n");

// When you need to change env vars mid-test without recreating the manager
resetEnvManager();
process.env.DYNAMIC_TEST_VAR = "initial";

const dynamicEnv = EnvManager.getInstance();
console.log(`Initial value: ${dynamicEnv.getString("DYNAMIC_TEST_VAR")}`);

// Change the value
process.env.DYNAMIC_TEST_VAR = "changed";

// Still shows cached value
console.log(`Before refresh: ${dynamicEnv.getString("DYNAMIC_TEST_VAR")}`);

// Refresh to pick up changes
dynamicEnv.refresh();

// Now shows updated value
console.log(`After refresh: ${dynamicEnv.getString("DYNAMIC_TEST_VAR")}`);

// Clean up
delete process.env.DYNAMIC_TEST_VAR;

// ============================================================================
// Using Dynamic Mode for Tests
// ============================================================================

console.log("\n=== Using Dynamic Mode for Tests ===\n");

// For tests that frequently change env vars, use dynamic mode
resetEnvManager();
process.env.DYNAMIC_MODE_VAR = "value1";

const dynamicModeEnv = EnvManager.getInstance({ dynamic: true });
console.log(`Is dynamic: ${dynamicModeEnv.isDynamic()}`);
console.log(`Value 1: ${dynamicModeEnv.getString("DYNAMIC_MODE_VAR")}`);

// Changes are immediately visible
process.env.DYNAMIC_MODE_VAR = "value2";
console.log(`Value 2: ${dynamicModeEnv.getString("DYNAMIC_MODE_VAR")}`);

process.env.DYNAMIC_MODE_VAR = "value3";
console.log(`Value 3: ${dynamicModeEnv.getString("DYNAMIC_MODE_VAR")}`);

// Clean up
delete process.env.DYNAMIC_MODE_VAR;

// ============================================================================
// Snapshot Testing
// ============================================================================

console.log("\n=== Snapshot Testing ===\n");

// Capture configuration as a snapshot for testing
function captureConfigSnapshot(env: EnvManager): Record<string, unknown> {
  return {
    environment: env.getEnvironment(),
    isProduction: env.isProduction(),
    isDevelopment: env.isDevelopment(),
    appName: env.getString("APP_NAME", "default"),
    port: env.getNumber("PORT", 3000),
    debug: env.getBoolean("DEBUG_MODE", false),
    apiUrl: env.getString("API_URL", "http://localhost"),
    cacheSize: env.getCacheSize(),
    isDynamic: env.isDynamic(),
  };
}

resetEnvManager();
EnvManager.bootstrap({
  overrides: {
    NODE_ENV: "production",
    APP_NAME: "snapshot-test",
    PORT: "8080",
  },
});

const snapshot = captureConfigSnapshot(EnvManager.getInstance());
console.log("Configuration snapshot:");
console.log(JSON.stringify(snapshot, null, 2));

// Clean up
resetEnvManager();
