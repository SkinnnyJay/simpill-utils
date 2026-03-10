/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts", "!src/**/constants.ts"],
  coverageDirectory: "coverage",
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 77, statements: 77 } },
  moduleFileExtensions: ["ts", "js", "json"],
  transform: { "^.+\\.ts$": "ts-jest" },
  verbose: true,
  clearMocks: true,
};
