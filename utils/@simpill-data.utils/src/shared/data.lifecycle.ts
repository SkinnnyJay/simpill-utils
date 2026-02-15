/**
 * Data lifecycle: created/updated timestamps, version stamp.
 */

export interface WithTimestamps {
  createdAt?: number;
  updatedAt?: number;
}

export interface WithVersion {
  version?: number;
}

export function addCreatedAt<T extends object>(obj: T): T & WithTimestamps {
  const now = Date.now();
  return { ...obj, createdAt: now, updatedAt: now };
}

export function touchUpdatedAt<T extends WithTimestamps>(obj: T): T {
  return { ...obj, updatedAt: Date.now() };
}

export function withNextVersion<T extends WithVersion>(obj: T): T {
  const v = (obj.version ?? 0) + 1;
  return { ...obj, version: v };
}

export function isNewerVersion(a: WithVersion, b: WithVersion): boolean {
  return (a.version ?? 0) > (b.version ?? 0);
}
