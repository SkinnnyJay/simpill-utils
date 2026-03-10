export type AsyncVoidFn = () => void | Promise<void>;

export async function runAsync(fn: AsyncVoidFn): Promise<void> {
  const result = fn();
  if (result instanceof Promise) {
    await result;
  }
}

export function ref<T>(initial: T): { value: T } {
  return { value: initial };
}

export function deferred<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function waitMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
