import { createLimit } from "./limit";

export type FilterOptions = {
  concurrency?: number;
};

/**
 * Filter items with async predicate, preserving order.
 */
export async function filterAsync<T>(
  items: Iterable<T>,
  predicate: (item: T, index: number) => Promise<boolean>,
  options?: FilterOptions,
): Promise<T[]> {
  const values = Array.from(items);
  const concurrency = options?.concurrency;
  if (!concurrency || concurrency >= values.length) {
    const matches = await Promise.all(values.map((value, index) => predicate(value, index)));
    return values.filter((_value, index) => matches[index]);
  }

  const limit = createLimit(concurrency);
  const matches = await Promise.all(values.map((value, index) => limit(predicate, value, index)));
  return values.filter((_value, index) => matches[index]);
}

/**
 * Reduce items in series with async reducer.
 */
export async function reduceAsync<T, R>(
  items: Iterable<T>,
  reducer: (acc: R, item: T, index: number) => Promise<R>,
  initial: R,
): Promise<R> {
  let acc = initial;
  let index = 0;
  for (const item of items) {
    acc = await reducer(acc, item, index);
    index += 1;
  }
  return acc;
}
