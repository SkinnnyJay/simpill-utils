import { defineConfig } from "vitest/config.js";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    extensions: [".ts"],
  },
  esbuild: { target: "ES2022" },
});
