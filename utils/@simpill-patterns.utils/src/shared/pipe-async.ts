/** Compose async functions; each receives previous result; short-circuits on first rejection. */
export function pipeAsync<T0, T1>(f0: (x: T0) => Promise<T1>): (x: T0) => Promise<T1>;
export function pipeAsync<T0, T1, T2>(
  f0: (x: T0) => Promise<T1>,
  f1: (x: T1) => Promise<T2>
): (x: T0) => Promise<T2>;
export function pipeAsync<T0, T1, T2, T3>(
  f0: (x: T0) => Promise<T1>,
  f1: (x: T1) => Promise<T2>,
  f2: (x: T2) => Promise<T3>
): (x: T0) => Promise<T3>;
export function pipeAsync<T>(...fns: Array<(x: T) => Promise<T>>): (x: T) => Promise<T>;
export function pipeAsync(
  ...fns: Array<(x: unknown) => Promise<unknown>>
): (x: unknown) => Promise<unknown> {
  return (x: unknown) => {
    let p: Promise<unknown> = Promise.resolve(x);
    for (const fn of fns) {
      p = p.then(fn);
    }
    return p;
  };
}
