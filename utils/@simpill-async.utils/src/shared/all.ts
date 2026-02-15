import { createLimit } from "./limit";

/** Options for allWithLimit: optional concurrency cap. */
export type AllOptions = {
  concurrency?: number;
};

/**
 * Run promise-returning thunks with optional concurrency limit. Order of results matches thunks.
 * @param thunks - Array of no-arg functions returning Promise<T>
 * @param options - Optional concurrency limit
 * @returns Promise of result array in same order as thunks
 */
export async function allWithLimit<T>(
  thunks: Array<() => Promise<T>>,
  options?: AllOptions,
): Promise<T[]> {
  const concurrency = options?.concurrency;
  if (!concurrency || concurrency >= thunks.length) {
    return Promise.all(thunks.map((thunk) => thunk()));
  }

  const limit = createLimit(concurrency);
  return Promise.all(thunks.map((thunk) => limit(thunk)));
}
