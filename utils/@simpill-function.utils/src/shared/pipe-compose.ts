/**
 * Pipe: (f, g, h)(x) => h(g(f(x)))
 * Compose: (f, g, h)(x) => f(g(h(x)))
 */

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T): T => fns.reduce((acc, fn) => fn(acc), arg);
}

export function pipeWith<T0, T1>(f0: (x: T0) => T1): (x: T0) => T1;
export function pipeWith<T0, T1, T2>(f0: (x: T0) => T1, f1: (x: T1) => T2): (x: T0) => T2;
export function pipeWith<T0, T1, T2, T3>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
): (x: T0) => T3;
export function pipeWith<T0, T1, T2, T3, T4>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
): (x: T0) => T4;
export function pipeWith(...fns: Array<(x: unknown) => unknown>): (x: unknown) => unknown {
  return (x: unknown): unknown => fns.reduce((acc, fn) => fn(acc), x);
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T): T => fns.reduceRight((acc, fn) => fn(acc), arg);
}

export function composeWith<T0, T1>(f0: (x: T0) => T1): (x: T0) => T1;
export function composeWith<T0, T1, T2>(f0: (x: T1) => T2, f1: (x: T0) => T1): (x: T0) => T2;
export function composeWith<T0, T1, T2, T3>(
  f0: (x: T2) => T3,
  f1: (x: T1) => T2,
  f2: (x: T0) => T1,
): (x: T0) => T3;
export function composeWith<T0, T1, T2, T3, T4>(
  f0: (x: T3) => T4,
  f1: (x: T2) => T3,
  f2: (x: T1) => T2,
  f3: (x: T0) => T1,
): (x: T0) => T4;
export function composeWith(...fns: Array<(x: unknown) => unknown>): (x: unknown) => unknown {
  return (x: unknown): unknown => fns.reduceRight((acc, fn) => fn(acc), x);
}
