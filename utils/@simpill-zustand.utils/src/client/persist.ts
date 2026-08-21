/**
 * Persist middleware helpers for client (browser): localStorage/sessionStorage,
 * versioning, migrate, partialize, merge, onRehydrateStorage, skipHydration (SSR).
 */

import {
  createJSONStorage,
  type PersistStorage,
  persist,
  type StorageValue,
} from "zustand/middleware";

export type PersistOptions<T> = {
  name: string;
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
  storage?: PersistStorage<T>;
  partialize?: (state: T) => Partial<T>;
  /** Custom merge of persisted state into current state (zustand persist option). */
  merge?: (persistedState: unknown, currentState: T) => T;
  /** Hook before/after rehydration (zustand persist option). */
  onRehydrateStorage?: (state: T) => ((state?: T, error?: unknown) => void) | undefined;
  /**
   * Skip automatic rehydration on init; call store.persist.rehydrate()
   * manually. Zustand's documented SSR pattern.
   */
  skipHydration?: boolean;
};

/** Shared helper options for withPersist / withPersistClientOnly. */
export type WithPersistOptions<T> = {
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
  storage?: "local" | "session";
  partialize?: (state: T) => Partial<T>;
  merge?: (persistedState: unknown, currentState: T) => T;
  onRehydrateStorage?: (state: T) => ((state?: T, error?: unknown) => void) | undefined;
  skipHydration?: boolean;
};

function createNoopStorage<T>(): PersistStorage<T> {
  return {
    getItem: () => null,
    setItem: () => {
      /* noop for server/no-storage */
    },
    removeItem: () => {
      /* noop */
    },
  };
}

/**
 * In-memory PersistStorage. Values are JSON round-tripped on write so
 * semantics match createJSONStorage(localStorage) exactly (functions dropped,
 * Dates stringified) — a faithful test/server double, not a leaky Map.
 * De-punts the server entry's long-standing doc promise of an
 * "in-memory persist adapter when needed".
 */
export function createInMemoryStorage<T>(): PersistStorage<T> & {
  /** Number of stored keys. */
  readonly size: number;
  clear: () => void;
} {
  const map = new Map<string, StorageValue<T>>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, JSON.parse(JSON.stringify(value)) as StorageValue<T>);
    },
    removeItem: (name) => {
      map.delete(name);
    },
    get size() {
      return map.size;
    },
    clear: () => {
      map.clear();
    },
  };
}

/**
 * Returns storage that no-ops on server (typeof window === 'undefined').
 * Use in Next.js/SSR so the store doesn't try to access localStorage during SSR.
 */
export function getClientOnlyStorage<T>(clientStorage: () => Storage): PersistStorage<T> {
  if (typeof window === "undefined") {
    return createNoopStorage<T>();
  }
  return createJSONStorage<T>(clientStorage) ?? createNoopStorage<T>();
}

function browserStorage<T>(kind: "local" | "session"): PersistStorage<T> {
  // BUG FIX: the original fell back to `{} as Storage` when the global was
  // missing. That "storage" has no setItem, so on a server EVERY set() on the
  // store threw `storage.setItem is not a function` and hasHydrated() stayed
  // false forever — the exact environment the typeof-guard was written for.
  const available =
    kind === "session"
      ? typeof sessionStorage !== "undefined"
      : typeof localStorage !== "undefined";
  if (!available) {
    return createNoopStorage<T>();
  }
  return (
    createJSONStorage<T>(() => (kind === "session" ? sessionStorage : localStorage)) ??
    createNoopStorage<T>()
  );
}

function buildOptions<T>(
  name: string,
  options: WithPersistOptions<T>,
  storage: PersistStorage<T>
): PersistOptions<T> {
  const built: PersistOptions<T> = {
    name,
    version: options.version ?? 1,
    migrate: options.migrate,
    storage,
  };
  // Only attach optional zustand persist options the caller actually set, so
  // the produced options object stays byte-compatible for existing callers.
  if (options.partialize) {
    built.partialize = options.partialize;
  }
  if (options.merge) {
    built.merge = options.merge;
  }
  if (options.onRehydrateStorage) {
    built.onRehydrateStorage = options.onRehydrateStorage;
  }
  if (options.skipHydration !== undefined) {
    built.skipHydration = options.skipHydration;
  }
  return built;
}

/**
 * Builds persist options with localStorage and optional version/migrate —
 * plus partialize/merge/onRehydrateStorage/skipHydration passthrough.
 * (partialize existed on the PersistOptions type but this helper silently
 * dropped it; the other three zustand persist options were missing entirely.)
 * Use with create(persist(builder, withPersist(...))).
 */
export function withPersist<T>(
  name: string,
  options: WithPersistOptions<T> = {}
): PersistOptions<T> {
  return buildOptions(name, options, browserStorage<T>(options.storage ?? "local"));
}

/**
 * Persist options that only use real storage on client (no-op on server).
 * Use in Next.js/SSR to avoid "localStorage is not defined" during SSR.
 */
export function withPersistClientOnly<T>(
  name: string,
  options: WithPersistOptions<T> = {}
): PersistOptions<T> {
  const clientStorage = options.storage === "session" ? () => sessionStorage : () => localStorage;
  return buildOptions(name, options, getClientOnlyStorage<T>(clientStorage));
}

/** Minimal persist API surface used by whenHydrated. */
export type HydratableStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: (state: unknown) => void) => () => void;
  };
};

/**
 * Resolves once the store's persist middleware finishes (re)hydration —
 * immediately if it already has. Framework-agnostic building block for the
 * standard Next.js "_hasHydrated" pattern: gate SSR-mismatch-prone UI on
 * `await whenHydrated(store)` or use it with skipHydration + rehydrate().
 */
export function whenHydrated(store: HydratableStore): Promise<void> {
  if (store.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export { persist, createJSONStorage };
