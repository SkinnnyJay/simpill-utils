/**
 * Interval Manager Utility
 *
 * Provides centralized management of setInterval/setTimeout to prevent memory leaks.
 * All managed intervals are tracked and can be cleaned up on process shutdown.
 *
 * Features:
 * - Named intervals for debugging and selective cleanup
 * - Automatic cleanup on process signals (SIGTERM, SIGINT)
 * - Group-based interval management
 * - Statistics for monitoring
 *
 * @example
 * ```typescript
 * import { intervalManager, createManagedInterval } from "@/lib/shared/utils/interval-manager";
 *
 * // Create a managed interval
 * const id = intervalManager.setInterval("health-check", () => {
 *   checkHealth();
 * }, 60000);
 *
 * // Or use the helper
 * const cleanup = createManagedInterval("analytics-flush", () => flush(), 30000);
 *
 * // Clear specific interval
 * intervalManager.clearInterval(id);
 *
 * // Clear all intervals in a group
 * intervalManager.clearGroup("analytics");
 *
 * // Get stats
 * const stats = intervalManager.getStats();
 * ```
 */

type TimerId = ReturnType<typeof setInterval>;

interface ManagedInterval {
  id: TimerId;
  name: string;
  group?: string;
  createdAt: number;
  intervalMs: number;
  type: "interval" | "timeout";
}

interface IntervalStats {
  activeIntervals: number;
  activeTimeouts: number;
  totalCreated: number;
  totalCleared: number;
  byGroup: Record<string, number>;
}

/**
 * Centralized interval/timeout manager
 */
class IntervalManager {
  private intervals: Map<string, ManagedInterval> = new Map();
  private counter = 0;
  private stats = {
    totalCreated: 0,
    totalCleared: 0,
  };
  private shutdownRegistered = false;

  constructor() {
    // Register shutdown handlers on first use
    this.registerShutdownHandlers();
  }

  /**
   * Create a managed interval
   * @param name Descriptive name for debugging
   * @param callback Function to execute
   * @param intervalMs Interval in milliseconds
   * @param group Optional group name for batch cleanup
   * @returns Unique interval ID
   */
  setInterval(
    name: string,
    callback: () => void,
    intervalMs: number,
    group?: string
  ): string {
    const uniqueId = `interval_${++this.counter}_${name}`;

    const timerId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error(`[IntervalManager] Error in interval "${name}":`, error);
      }
    }, intervalMs);

    this.intervals.set(uniqueId, {
      id: timerId,
      name,
      group,
      createdAt: Date.now(),
      intervalMs,
      type: "interval",
    });

    this.stats.totalCreated++;
    return uniqueId;
  }

  /**
   * Create a managed timeout
   * @param name Descriptive name for debugging
   * @param callback Function to execute
   * @param timeoutMs Timeout in milliseconds
   * @param group Optional group name for batch cleanup
   * @returns Unique timeout ID
   */
  setTimeout(
    name: string,
    callback: () => void,
    timeoutMs: number,
    group?: string
  ): string {
    const uniqueId = `timeout_${++this.counter}_${name}`;

    const timerId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error(`[IntervalManager] Error in timeout "${name}":`, error);
      } finally {
        // Auto-cleanup after execution
        this.intervals.delete(uniqueId);
      }
    }, timeoutMs);

    this.intervals.set(uniqueId, {
      id: timerId,
      name,
      group,
      createdAt: Date.now(),
      intervalMs: timeoutMs,
      type: "timeout",
    });

    this.stats.totalCreated++;
    return uniqueId;
  }

  /**
   * Clear a specific interval or timeout by ID
   */
  clearInterval(uniqueId: string): boolean {
    const managed = this.intervals.get(uniqueId);
    if (!managed) {
      return false;
    }

    if (managed.type === "interval") {
      clearInterval(managed.id);
    } else {
      clearTimeout(managed.id);
    }

    this.intervals.delete(uniqueId);
    this.stats.totalCleared++;
    return true;
  }

  /**
   * Alias for clearInterval (works for both)
   */
  clearTimeout(uniqueId: string): boolean {
    return this.clearInterval(uniqueId);
  }

  /**
   * Clear all intervals/timeouts in a group
   */
  clearGroup(group: string): number {
    let cleared = 0;
    for (const [id, managed] of this.intervals.entries()) {
      if (managed.group === group) {
        if (managed.type === "interval") {
          clearInterval(managed.id);
        } else {
          clearTimeout(managed.id);
        }
        this.intervals.delete(id);
        this.stats.totalCleared++;
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Clear all managed intervals and timeouts
   */
  clearAll(): number {
    let cleared = 0;
    for (const [id, managed] of this.intervals.entries()) {
      if (managed.type === "interval") {
        clearInterval(managed.id);
      } else {
        clearTimeout(managed.id);
      }
      this.intervals.delete(id);
      this.stats.totalCleared++;
      cleared++;
    }
    return cleared;
  }

  /**
   * Get statistics about managed intervals
   */
  getStats(): IntervalStats {
    const byGroup: Record<string, number> = {};
    let activeIntervals = 0;
    let activeTimeouts = 0;

    for (const managed of this.intervals.values()) {
      if (managed.type === "interval") {
        activeIntervals++;
      } else {
        activeTimeouts++;
      }

      const groupName = managed.group || "ungrouped";
      byGroup[groupName] = (byGroup[groupName] || 0) + 1;
    }

    return {
      activeIntervals,
      activeTimeouts,
      totalCreated: this.stats.totalCreated,
      totalCleared: this.stats.totalCleared,
      byGroup,
    };
  }

  /**
   * List all active intervals (for debugging)
   */
  listActive(): Array<{
    id: string;
    name: string;
    group?: string;
    type: "interval" | "timeout";
    ageMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.intervals.entries()).map(([id, managed]) => ({
      id,
      name: managed.name,
      group: managed.group,
      type: managed.type,
      ageMs: now - managed.createdAt,
    }));
  }

  /**
   * Register process shutdown handlers
   */
  private registerShutdownHandlers(): void {
    if (this.shutdownRegistered) {
      return;
    }

    // Only register in Node.js environment
    if (typeof process !== "undefined" && process.on) {
      const cleanup = () => {
        const cleared = this.clearAll();
        if (cleared > 0) {
          console.log(`[IntervalManager] Cleared ${cleared} intervals on shutdown`);
        }
      };

      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
      process.on("beforeExit", cleanup);

      this.shutdownRegistered = true;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/** Global interval manager instance */
export const intervalManager = new IntervalManager();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a managed interval with automatic cleanup function
 *
 * @example
 * ```typescript
 * const cleanup = createManagedInterval("heartbeat", () => sendHeartbeat(), 30000);
 * // Later: cleanup();
 * ```
 */
export function createManagedInterval(
  name: string,
  callback: () => void,
  intervalMs: number,
  group?: string
): () => void {
  const id = intervalManager.setInterval(name, callback, intervalMs, group);
  return () => intervalManager.clearInterval(id);
}

/**
 * Create a managed timeout with automatic cleanup function
 *
 * @example
 * ```typescript
 * const cancel = createManagedTimeout("delayed-action", () => doAction(), 5000);
 * // Later: cancel();
 * ```
 */
export function createManagedTimeout(
  name: string,
  callback: () => void,
  timeoutMs: number,
  group?: string
): () => void {
  const id = intervalManager.setTimeout(name, callback, timeoutMs, group);
  return () => intervalManager.clearTimeout(id);
}

// Re-export the class for advanced use cases
export { IntervalManager };
