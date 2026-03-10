/**
 * Resolve promise values inside an object.
 */
export async function promiseProps<T extends Record<string, unknown>>(
  input: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(input) as Array<[keyof T, T[keyof T]]>;
  const values = await Promise.all(entries.map(([, value]) => Promise.resolve(value)));

  const result = {} as { [K in keyof T]: Awaited<T[K]> };
  entries.forEach(([key], index) => {
    result[key] = values[index] as Awaited<T[keyof T]>;
  });
  return result;
}
