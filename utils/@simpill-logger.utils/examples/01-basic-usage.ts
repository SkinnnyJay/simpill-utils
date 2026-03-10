/** Run: npx ts-node examples/01-basic-usage.ts */
import { getLogger, LoggerFactory } from "@simpill/logger.utils";

console.log("=== Creating Loggers ===\n");
const logger = getLogger("MyService");

// Log at different levels
logger.info("Application started");
logger.warn("Cache miss detected", { key: "user:123" });
logger.debug("Processing request", { requestId: "abc-123" });
logger.error("Failed to connect", { host: "db.example.com", retries: 3 });

console.log("\n=== Logger with Default Metadata ===\n");
const requestLogger = getLogger("RequestHandler", {
  requestId: "req-456",
  userId: "user-789",
});

requestLogger.info("Processing request");
requestLogger.info("Request completed", { duration: 150 });

console.log("\n=== Root Logger ===\n");
const rootLogger = LoggerFactory.getRootLogger();
rootLogger.info("Root logger message");

console.log("\n=== Logger Caching ===\n");
const logger1 = getLogger("CachedService");
const logger2 = getLogger("CachedService");

console.log(`Same instance (no metadata): ${logger1 === logger2}`);
console.log(`Cache size: ${LoggerFactory.getCacheSize()}`);

// Loggers with metadata are always fresh
const loggerA = getLogger("MetaService", { version: "1.0" });
const loggerB = getLogger("MetaService", { version: "2.0" });

console.log(`Same instance (with metadata): ${loggerA === loggerB}`);

// Clear the cache if needed
LoggerFactory.clearCache();
console.log(`Cache size after clear: ${LoggerFactory.getCacheSize()}`);

// ============================================================================
// Cleanup
// ============================================================================

// Reset factory state (useful in tests)
LoggerFactory.reset().then(() => {
  console.log("\nFactory reset complete");
});
