/**
 * @simpill/logger.utils - Custom Adapters
 *
 * This example demonstrates how to use custom adapters and formatters.
 *
 * Run: npx ts-node examples/02-custom-adapters.ts
 */

import {
  ColoredFormatterAdapter,
  coloredFormatter,
  getLogger,
  jsonFormatter,
  LoggerFactory,
  minimalFormatter,
  SimpleFormatterAdapter,
  SimpleLoggerAdapter,
  verboseFormatter,
} from "@simpill/logger.utils";

// ============================================================================
// Using Built-in Formatters
// ============================================================================

console.log("=== JSON Formatter ===\n");

// Configure with JSON output
const jsonAdapter = new SimpleLoggerAdapter("App", undefined, jsonFormatter);
LoggerFactory.setAdapter(jsonAdapter);

const jsonLogger = getLogger("JsonService");
jsonLogger.info("Structured log", { userId: "123", action: "login" });

// ============================================================================
// Colored Output
// ============================================================================

console.log("\n=== Colored Formatter ===\n");

// Configure with colored output (great for development)
const coloredAdapter = new SimpleLoggerAdapter("App", undefined, coloredFormatter);
LoggerFactory.setAdapter(coloredAdapter);

const coloredLogger = getLogger("ColoredService");
coloredLogger.info("Info message");
coloredLogger.warn("Warning message");
coloredLogger.debug("Debug message");
coloredLogger.error("Error message");

// ============================================================================
// Minimal Output
// ============================================================================

console.log("\n=== Minimal Formatter ===\n");

// Configure with minimal output (level + message only)
const minimalAdapter = new SimpleLoggerAdapter("App", undefined, minimalFormatter);
LoggerFactory.setAdapter(minimalAdapter);

const minimalLogger = getLogger("MinimalService");
minimalLogger.info("Clean and simple");
minimalLogger.warn("Just the essentials");

// ============================================================================
// Verbose Output
// ============================================================================

console.log("\n=== Verbose Formatter ===\n");

// Configure with verbose output (includes PID)
const verboseAdapter = new SimpleLoggerAdapter("App", undefined, verboseFormatter);
LoggerFactory.setAdapter(verboseAdapter);

const verboseLogger = getLogger("VerboseService");
verboseLogger.info("Full details", { requestId: "abc" });

// ============================================================================
// Custom Formatter Configuration
// ============================================================================

console.log("\n=== Custom Formatter Configuration ===\n");

// Create a custom formatter with specific options
const customFormatter = new SimpleFormatterAdapter({
  includeTimestamp: true,
  includeName: true,
  includeMetadata: true,
  jsonOutput: false,
  levelLabels: {
    INFO: "INFO",
    WARN: "WARNING",
    ERROR: "ERR",
    DEBUG: "DBG",
  },
  timestampFormatter: (ts) => new Date(ts).toLocaleTimeString(),
});

const customAdapter = new SimpleLoggerAdapter("App", undefined, customFormatter);
LoggerFactory.setAdapter(customAdapter);

const customLogger = getLogger("CustomService");
customLogger.info("Custom formatted log");
customLogger.warn("With custom level label");

// ============================================================================
// Custom Colored Formatter
// ============================================================================

console.log("\n=== Custom Colored Formatter ===\n");

// Create a colored formatter with custom colors
const customColoredFormatter = new ColoredFormatterAdapter({
  includeTimestamp: true,
  includeName: true,
  includeMetadata: true,
  bright: true,
  colors: {
    info: "\x1b[32m", // Green for info
    warn: "\x1b[33m", // Yellow for warn
    error: "\x1b[31m", // Red for error
    debug: "\x1b[36m", // Cyan for debug
  },
});

const customColoredAdapter = new SimpleLoggerAdapter("App", undefined, customColoredFormatter);
LoggerFactory.setAdapter(customColoredAdapter);

const customColoredLogger = getLogger("CustomColoredService");
customColoredLogger.info("Green info");
customColoredLogger.warn("Yellow warning");
customColoredLogger.debug("Cyan debug");
customColoredLogger.error("Red error");

// ============================================================================
// Cleanup
// ============================================================================

LoggerFactory.reset().then(() => {
  console.log("\nFactory reset complete");
});
