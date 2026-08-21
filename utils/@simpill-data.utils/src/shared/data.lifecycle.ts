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

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Stamps createdAt/updatedAt. An existing finite createdAt is preserved —
 * the original overwrote it, so re-stamping an already-persisted record
 * silently destroyed its real creation time.
 */
export function addCreatedAt<T extends object>(obj: T): T & WithTimestamps {
  const now = Date.now();
  const createdAt = finiteOr((obj as WithTimestamps).createdAt, now);
  return { ...obj, createdAt, updatedAt: now };
}

export function touchUpdatedAt<T extends WithTimestamps>(obj: T): T {
  return { ...obj, updatedAt: Date.now() };
}

/**
 * Non-finite versions (NaN/Infinity) are treated as 0 — the original produced
 * version: NaN forever once a NaN slipped in (NaN + 1 === NaN).
 */
export function withNextVersion<T extends WithVersion>(obj: T): T {
  const v = finiteOr(obj.version, 0) + 1;
  return { ...obj, version: v };
}

export function isNewerVersion(a: WithVersion, b: WithVersion): boolean {
  return finiteOr(a.version, 0) > finiteOr(b.version, 0);
}
