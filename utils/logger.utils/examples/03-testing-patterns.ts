/**
 * @simpill/logger.utils - Testing Patterns
 *
 * This example demonstrates best practices for testing with loggers.
 *
 * Run: npx ts-node examples/03-testing-patterns.ts
 */

import { getLogger, type LogEntry, type LoggerAdapter, LoggerFactory } from "@simpill/logger.utils";

// ============================================================================
// Mock Mode - Suppress Log Output
// ============================================================================

console.log("=== Mock Mode ===\n");

// Enable mock mode to suppress all log output (great for tests)
LoggerFactory.enableMock();
console.log(`Mock enabled: ${LoggerFactory.isMockEnabled()}`);

const silentLogger = getLogger("SilentService");
silentLogger.info("This won't appear in output");
silentLogger.error("Neither will this");

// Disable mock mode to restore output
LoggerFactory.disableMock();
console.log(`Mock enabled: ${LoggerFactory.isMockEnabled()}`);

const loudLogger = getLogger("LoudService");
loudLogger.info("This will appear!");

// ============================================================================
// Capturing Logs for Assertions
// ============================================================================

console.log("\n=== Capturing Logs ===\n");

// Create a custom adapter that captures logs
const capturedLogs: LogEntry[] = [];

const capturingAdapter: LoggerAdapter = {
  initialize: () => {
    // Clear captured logs on init
    capturedLogs.length = 0;
  },
  log: (entry) => {
    capturedLogs.push(entry);
  },
  child: function (name, defaultMetadata) {
    return {
      ...this,
      log: (entry: LogEntry) => {
        capturedLogs.push({
          ...entry,
          name,
          metadata: { ...defaultMetadata, ...entry.metadata },
        });
      },
    };
  },
};

LoggerFactory.setAdapter(capturingAdapter);

// Now logs are captured instead of printed
const testLogger = getLogger("TestService");
testLogger.info("First log", { userId: "123" });
testLogger.warn("Second log");
testLogger.error("Third log", { error: "Something went wrong" });

// Assert on captured logs
console.log(`Captured ${capturedLogs.length} logs:`);
for (const log of capturedLogs) {
  console.log(`  [${log.level}] ${log.name}: ${log.message}`);
}

// Example assertions (in a real test framework):
const infoLogs = capturedLogs.filter((l) => l.level === "INFO");
const errorLogs = capturedLogs.filter((l) => l.level === "ERROR");
console.log(`\nInfo logs: ${infoLogs.length}`);
console.log(`Error logs: ${errorLogs.length}`);
console.log(`First log has userId: ${capturedLogs[0].metadata?.userId === "123"}`);

// ============================================================================
// Reset Between Tests
// ============================================================================

console.log("\n=== Reset Between Tests ===\n");

// Always reset the factory between tests
async function resetForTest(): Promise<void> {
  await LoggerFactory.reset();
  // Cache is automatically cleared on reset
  console.log(`Cache size after reset: ${LoggerFactory.getCacheSize()}`);
}

// Simulate test lifecycle
console.log("Test 1: Setup");
getLogger("Service1");
getLogger("Service2");
console.log(`Cache size: ${LoggerFactory.getCacheSize()}`);

await resetForTest();

console.log("\nTest 2: Setup");
getLogger("Service3");
console.log(`Cache size: ${LoggerFactory.getCacheSize()}`);

await resetForTest();

// ============================================================================
// Cache Management in Tests
// ============================================================================

console.log("\n=== Cache Management ===\n");

// Clear cache without full reset (keeps adapter)
getLogger("CachedService1");
getLogger("CachedService2");
console.log(`Cache size: ${LoggerFactory.getCacheSize()}`);

LoggerFactory.clearCache();
console.log(`Cache size after clear: ${LoggerFactory.getCacheSize()}`);

// Get fresh logger instances after cache clear
const freshLogger1 = getLogger("CachedService1");
const freshLogger2 = getLogger("CachedService1");
console.log(`Same instance after clear: ${freshLogger1 === freshLogger2}`);

// ============================================================================
// Jest/Vitest Pattern
// ============================================================================

console.log("\n=== Jest/Vitest Pattern ===\n");

console.log(`
// In your test file:

describe("MyService", () => {
  beforeEach(async () => {
    // Enable mock mode to suppress output
    LoggerFactory.enableMock();
    // Or use a capturing adapter for assertions
  });

  afterEach(async () => {
    // Reset factory state between tests
    await LoggerFactory.reset();
  });

  it("should log on startup", () => {
    // Your test code
    const service = new MyService();
    service.start();
    
    // If using capturing adapter:
    // expect(capturedLogs).toContainEqual(
    //   expect.objectContaining({ message: "Service started" })
    // );
  });
});
`);

// ============================================================================
// Cleanup
// ============================================================================

await LoggerFactory.reset();
console.log("Examples complete!");
