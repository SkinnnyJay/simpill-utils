/**
 * Shared Jest configuration base for all @simpill/* packages.
 *
 * Usage in a package's jest.config.js:
 *   const base = require("../../jest.config.base.js");
 *   module.exports = { ...base, collectCoverageFrom: [...] };
 *
 * The moduleNameMapper path assumes a two-level deep package layout:
 *   utils/@simpill-<name>.utils/jest.config.js  →  ../../jest.config.base.js
 * Adjust if your package is at a different depth.
 */

/** @type {import('jest').Config} */
const base = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: [
    "**/__tests__/**/*.unit.test.ts",
    "**/__tests__/**/*.integration.test.ts",
    "**/__tests__/**/*.e2e.test.ts",
  ],
  moduleNameMapper: {
    "^@simpill/(.+)$": "<rootDir>/../@simpill-$1/src/index.ts",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = base;
