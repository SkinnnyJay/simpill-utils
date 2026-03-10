export const LIMIT = {
  PERCENT_SCALE: 100,
  CHARS_PER_TOKEN_ESTIMATE: 4,
  MARKDOWN_COLLAPSE_MIN_NEWLINES: 3,
  TELEMETRY_MAX_SNAPSHOTS: 500,
} as const;

export const INDENT_SPACES = 2;

export const ENCODING = {
  UTF8: "utf8",
} as const;

export const ERROR_CODE = {
  ENOENT: "ENOENT",
} as const;

/** Literal audit constants. */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_2 = 2;
export const VALUE_3 = 3;
export const VALUE_4 = 4;
export const VALUE_5 = 5;
export const VALUE_6 = 6;
export const VALUE_16 = 16;
export const VALUE_20 = 20;
export const VALUE_30 = 30;
export const VALUE_42 = 42;
export const VALUE_60 = 60;
export const VALUE_80 = 80;
export const VALUE_999 = 999;
export const TIMEOUT_MS_1000 = 1000;

/** Error messages for strategies and optimizer (literal audit). */
export const ERROR_MESSAGES = {
  YAML_INVALID: "Invalid YAML input provided to YamlCompressionStrategy.",
  TOON_INVALID_JSON: "Invalid JSON input provided to ToonCompressionStrategy.",
  TOON_ENCODER_UNAVAILABLE: "TOON encoder is not available.",
  JSON_INVALID: "Invalid JSON input provided to JsonCompressionStrategy.",
  JSON_UNABLE_NORMALIZE: "Unable to normalize JSON input.",
  CSV_INVALID: "Invalid CSV input provided to CsvCompressionStrategy.",
  XML_INVALID: "Invalid XML input provided to XmlCompressionStrategy.",
  TONL_INVALID_JSON: "Invalid JSON input provided to TonlCompressionStrategy.",
  TONL_ENCODER_UNAVAILABLE: "TONL encoder is not available.",
  UNSUPPORTED_COMPRESSION_TYPE_PREFIX: "Unsupported compression type: " as const,
  /** TelemetryFactory: prefix for unsupported storage kind (append kind). */
  UNSUPPORTED_TELEMETRY_STORAGE_KIND_PREFIX: "Unsupported telemetry storage kind: " as const,
} as const;
