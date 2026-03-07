/**
 * Ensures all monolith @simpill packages resolve (types + runtime).
 * Packages with dedicated unit tests are not re-imported here.
 */
import { describe, expect, it } from "vitest";

const PACKAGES_TO_RESOLVE: Array<{ name: string; loader: () => Promise<Record<string, unknown>> }> = [
  { name: "adapters.utils", loader: () => import("@simpill/adapters.utils") },
  { name: "algorithms.utils", loader: () => import("@simpill/algorithms.utils") },
  { name: "annotations.utils", loader: () => import("@simpill/annotations.utils") },
  { name: "api.utils", loader: () => import("@simpill/api.utils") },
  { name: "collections.utils", loader: () => import("@simpill/collections.utils") },
  { name: "crypto.utils", loader: () => import("@simpill/crypto.utils") },
  { name: "data.utils", loader: () => import("@simpill/data.utils") },
  { name: "enum.utils", loader: () => import("@simpill/enum.utils") },
  { name: "events.utils", loader: () => import("@simpill/events.utils") },
  { name: "factories.utils", loader: () => import("@simpill/factories.utils") },
  { name: "file.utils", loader: () => import("@simpill/file.utils") },
  { name: "function.utils", loader: () => import("@simpill/function.utils") },
  { name: "http.utils", loader: () => import("@simpill/http.utils") },
  { name: "logger.utils", loader: () => import("@simpill/logger.utils") },
  { name: "middleware.utils", loader: () => import("@simpill/middleware.utils") },
  { name: "misc.utils", loader: () => import("@simpill/misc.utils") },
  { name: "nextjs.utils", loader: () => import("@simpill/nextjs.utils") },
  { name: "number.utils", loader: () => import("@simpill/number.utils") },
  { name: "observability.utils", loader: () => import("@simpill/observability.utils") },
  { name: "protocols.utils", loader: () => import("@simpill/protocols.utils") },
  { name: "react.utils", loader: () => import("@simpill/react.utils") },
  { name: "request-context.utils", loader: () => import("@simpill/request-context.utils") },
  { name: "resilience.utils", loader: () => import("@simpill/resilience.utils") },
  { name: "socket.utils", loader: () => import("@simpill/socket.utils") },
  { name: "test.utils", loader: () => import("@simpill/test.utils") },
  { name: "token-optimizer.utils", loader: () => import("@simpill/token-optimizer.utils") },
  { name: "zod.utils", loader: () => import("@simpill/zod.utils") },
  { name: "zustand.utils", loader: () => import("@simpill/zustand.utils") },
];

describe("@simpill package resolution", () => {
  for (const { name, loader } of PACKAGES_TO_RESOLVE) {
    it(`resolves @simpill/${name}`, async () => {
      const mod = await loader();
      expect(mod).toBeDefined();
      expect(mod).not.toBeNull();
      expect(typeof mod).toBe("object");
    });
  }
});
