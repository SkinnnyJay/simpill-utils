import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use monorepo root so file tracing includes linked utils packages
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
