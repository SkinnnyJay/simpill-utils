import { z } from "zod";
import type { AnalyticsSnapshot } from "./token-optimizer.types";

export interface TelemetryStorage {
  persistSnapshot(snapshot: AnalyticsSnapshot): Promise<void>;
  fetchRecent(limit?: number): Promise<AnalyticsSnapshot[]>;
  purge(): Promise<void>;
}

export const telemetryStorageKindSchema = z.enum(["JSON"]);

export type TelemetryStorageKind = z.infer<typeof telemetryStorageKindSchema>;

export const jsonTelemetryStorageConfigSchema = z.object({
  filePath: z.string().min(1),
});

export type JsonTelemetryStorageConfig = z.infer<typeof jsonTelemetryStorageConfigSchema>;
