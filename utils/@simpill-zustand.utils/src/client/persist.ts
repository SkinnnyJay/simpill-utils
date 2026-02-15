/**
 * Persist middleware helpers for client (browser): localStorage/sessionStorage, versioning, migrate.
 */

import { createJSONStorage, type PersistStorage, persist } from "zustand/middleware";

export type PersistOptions<T> = {
  name: string;
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
  storage?: PersistStorage<T>;
  partialize?: (state: T) => Partial<T>;
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
 * Returns storage that no-ops on server (typeof window === 'undefined').
 * Use in Next.js/SSR so the store doesn't try to access localStorage during SSR.
 */
export function getClientOnlyStorage<T>(clientStorage: () => Storage): PersistStorage<T> {
  if (typeof window === "undefined") {
    return createNoopStorage<T>();
  }
  return createJSONStorage<T>(clientStorage) ?? createNoopStorage<T>();
}

/**
 * Builds persist options with localStorage and optional version/migrate.
 * Use with create(persist(builder, withPersist(...))).
 */
export function withPersist<T>(
  name: string,
  options: {
    version?: number;
    migrate?: (persistedState: unknown, version: number) => T;
    storage?: "local" | "session";
  } = {}
): PersistOptions<T> {
  const storage =
    options.storage === "session"
      ? (createJSONStorage<T>(() =>
          typeof sessionStorage !== "undefined" ? sessionStorage : ({} as Storage)
        ) ?? createNoopStorage<T>())
      : (createJSONStorage<T>(() =>
          typeof localStorage !== "undefined" ? localStorage : ({} as Storage)
        ) ?? createNoopStorage<T>());
  return {
    name,
    version: options.version ?? 1,
    migrate: options.migrate,
    storage,
  };
}

/**
 * Persist options that only use real storage on client (no-op on server).
 * Use in Next.js/SSR to avoid "localStorage is not defined" during SSR.
 */
export function withPersistClientOnly<T>(
  name: string,
  options: {
    version?: number;
    migrate?: (persistedState: unknown, version: number) => T;
    storage?: "local" | "session";
  } = {}
): PersistOptions<T> {
  const clientStorage = options.storage === "session" ? () => sessionStorage : () => localStorage;
  return {
    name,
    version: options.version ?? 1,
    migrate: options.migrate,
    storage: getClientOnlyStorage<T>(clientStorage),
  };
}

export { persist, createJSONStorage };
