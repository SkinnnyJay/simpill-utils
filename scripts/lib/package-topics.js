/**
 * Shared package → topics/keywords for GitHub topics and npm package.json keywords.
 * Used by github-set-all-topics.js and utils-set-npm-keywords.js.
 */

const BASE_TOPICS = [
  "simpill",
  "typescript",
  "utilities",
  "type-safe",
  "esm",
  "tree-shakeable",
];

/** Package short name (e.g. env.utils) → extra topics for that package */
const PACKAGE_TOPICS = {
  "adapters.utils": ["adapters", "nodejs"],
  "algorithms.utils": ["algorithms", "nodejs"],
  "annotations.utils": ["annotations", "metadata", "nodejs"],
  "api.utils": ["api", "http", "nodejs"],
  "array.utils": ["array", "nodejs"],
  "async.utils": ["async", "promises", "nodejs"],
  "cache.utils": ["cache", "nodejs"],
  "collections.utils": ["collections", "data-structures", "nodejs"],
  "crypto.utils": ["crypto", "security", "nodejs"],
  "data.utils": ["data", "validation", "nodejs"],
  "env.utils": ["env", "dotenv", "nodejs", "edge-runtime"],
  "enum.utils": ["enum", "nodejs"],
  "errors.utils": ["errors", "nodejs"],
  "events.utils": ["events", "nodejs"],
  "factories.utils": ["factories", "nodejs"],
  "file.utils": ["file", "nodejs"],
  "function.utils": ["function", "nodejs"],
  "http.utils": ["http", "nodejs"],
  "logger.utils": ["logging", "nodejs"],
  "middleware.utils": ["middleware", "nodejs"],
  "misc.utils": ["nodejs"],
  "nextjs.utils": ["nextjs", "react", "nodejs"],
  "number.utils": ["number", "nodejs"],
  "object.utils": ["object", "nodejs"],
  "observability.utils": ["observability", "logging", "nodejs"],
  "patterns.utils": ["patterns", "nodejs"],
  "protocols.utils": ["protocols", "nodejs"],
  "react.utils": ["react", "nodejs"],
  "request-context.utils": ["request-context", "nodejs"],
  "resilience.utils": ["resilience", "nodejs"],
  "socket.utils": ["socket", "websocket", "nodejs"],
  "string.utils": ["string", "nodejs"],
  "test.utils": ["testing", "nodejs"],
  "time.utils": ["time", "date", "nodejs"],
  "token-optimizer.utils": ["tokens", "nodejs"],
  "uuid.utils": ["uuid", "nodejs"],
  "zod.utils": ["zod", "validation", "nodejs"],
  "zustand.utils": ["zustand", "react", "state", "nodejs"],
};

module.exports = { BASE_TOPICS, PACKAGE_TOPICS };
