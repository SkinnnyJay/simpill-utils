/** Settled promise result: fulfilled with value or rejected with reason. */
export type Reflected<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

/**
 * Reflect a promise into an object that never throws.
 * @param promise - Promise to settle
 * @returns Promise of { status, value } or { status, reason }
 */
export async function reflect<T>(promise: Promise<T>): Promise<Reflected<T>> {
  try {
    const value = await promise;
    return { status: "fulfilled", value };
  } catch (reason) {
    return { status: "rejected", reason };
  }
}
