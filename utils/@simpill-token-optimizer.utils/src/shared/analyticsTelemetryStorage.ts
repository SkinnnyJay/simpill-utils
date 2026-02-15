import { LIMIT } from "./constants";
import type { AnalyticsService } from "./stubs/analytics";
import type { TelemetryStorage } from "./telemetry.types";
import type { AnalyticsSnapshot } from "./token-optimizer.types";

export interface AnalyticsTelemetryStorageConfig {
  analyticsService: AnalyticsService;
  compressionType?: string;
  agentId?: string;
  chatId?: string;
  fallbackStorage?: TelemetryStorage;
}

export const createAnalyticsTelemetryStorage = (
  config: AnalyticsTelemetryStorageConfig,
): TelemetryStorage => {
  const snapshots: AnalyticsSnapshot[] = [];

  return {
    async persistSnapshot(snapshot: AnalyticsSnapshot): Promise<void> {
      snapshots.push(snapshot);

      if (snapshots.length > LIMIT.TELEMETRY_MAX_SNAPSHOTS) {
        snapshots.shift();
      }

      await config.analyticsService.trackTokenOptimization(snapshot, {
        compressionType: config.compressionType,
        agentId: config.agentId,
        chatId: config.chatId,
      });

      if (config.fallbackStorage) {
        await config.fallbackStorage.persistSnapshot(snapshot);
      }
    },

    async fetchRecent(limit?: number): Promise<AnalyticsSnapshot[]> {
      if (config.fallbackStorage) {
        return config.fallbackStorage.fetchRecent(limit);
      }

      if (typeof limit === "number" && limit >= 0) {
        return snapshots.slice(-limit).reverse();
      }
      return snapshots.slice().reverse();
    },

    async purge(): Promise<void> {
      snapshots.length = 0;

      if (config.fallbackStorage) {
        await config.fallbackStorage.purge();
      }
    },
  };
};

export const createCompositeTelemetryStorage = (storages: TelemetryStorage[]): TelemetryStorage => {
  return {
    async persistSnapshot(snapshot: AnalyticsSnapshot): Promise<void> {
      await Promise.all(storages.map((storage) => storage.persistSnapshot(snapshot)));
    },

    async fetchRecent(limit?: number): Promise<AnalyticsSnapshot[]> {
      for (const storage of storages) {
        const results = await storage.fetchRecent(limit);
        if (results.length > 0) {
          return results;
        }
      }
      return [];
    },

    async purge(): Promise<void> {
      await Promise.all(storages.map((storage) => storage.purge()));
    },
  };
};
