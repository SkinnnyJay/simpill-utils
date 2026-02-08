/**
 * @file Formatters Index
 * @description Log formatting utilities and adapters
 */

// Formatter adapter interface (plugin architecture)
export {
  createFormatterContext,
  type FormattedOutput,
  type FormatterAdapter,
  type FormatterContext,
  formatWithAdapter,
  isFormatterAdapter,
  outputToString,
} from "./formatter.adapter";

// Simple formatter (default implementation)
export {
  createSimpleFormatter,
  defaultFormatter,
  jsonFormatter as jsonFormatterAdapter,
  minimalFormatter,
  SimpleFormatterAdapter,
  type SimpleFormatterConfig,
  verboseFormatter,
} from "./simple.formatter";

// Colored formatter (terminal output)
export {
  COLORS,
  ColoredFormatterAdapter,
  type ColoredFormatterConfig,
  coloredFormatter,
  createColoredFormatter,
} from "./colored.formatter";

// Legacy formatters (backward compatibility)
export {
  createFormatter,
  type FormatterOptions,
  jsonFormatter,
  serializeMetadata,
  simpleFormatter,
  timestampFormatter,
} from "./legacy.formatters";
