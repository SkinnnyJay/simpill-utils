/**
 * Run async functions in series.
 */
export async function series<T>(thunks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const thunk of thunks) {
    results.push(await thunk());
  }
  return results;
}

/**
 * Map over items in series (concurrency = 1).
 */
export async function mapSeries<T, R>(
  items: Iterable<T>,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  for (const item of items) {
    results.push(await mapper(item, index));
    index += 1;
  }
  return results;
}
