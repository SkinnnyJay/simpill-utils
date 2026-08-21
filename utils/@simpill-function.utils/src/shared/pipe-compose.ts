/**
 * Pipe: (f, g, h)(x) => h(g(f(x)))
 * Compose: (f, g, h)(x) => f(g(h(x)))
 *
 * Implementation note: composition is specialized at creation time for the
 * common arities (0-4 functions) so the hot path is direct calls instead of
 * a per-invocation Array#reduce (allocation-free, benchmarked faster).
 */

type Unary = (x: unknown) => unknown;

function chainLtr(fns: Unary[]): Unary {
  switch (fns.length) {
    case 0:
      return (x) => x;
    case 1:
      return fns[0];
    case 2: {
      const [f0, f1] = fns;
      return (x) => f1(f0(x));
    }
    case 3: {
      const [f0, f1, f2] = fns;
      return (x) => f2(f1(f0(x)));
    }
    case 4: {
      const [f0, f1, f2, f3] = fns;
      return (x) => f3(f2(f1(f0(x))));
    }
    default:
      return (x) => {
        let acc = x;
        for (let i = 0; i < fns.length; i++) acc = fns[i](acc);
        return acc;
      };
  }
}

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return chainLtr(fns as Unary[]) as (arg: T) => T;
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return chainLtr((fns as Unary[]).slice().reverse()) as (arg: T) => T;
}

// pipeWith / composeWith: type-changing composition with inference up to 12
// functions (was 4), plus an untyped rest fallback so longer chains still
// compile instead of erroring.

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
export function pipeWith<T0, T1, T2, T3, T4, T5>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
): (x: T0) => T5;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
): (x: T0) => T6;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6, T7>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
  f6: (x: T6) => T7,
): (x: T0) => T7;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6, T7, T8>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
  f6: (x: T6) => T7,
  f7: (x: T7) => T8,
): (x: T0) => T8;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
  f6: (x: T6) => T7,
  f7: (x: T7) => T8,
  f8: (x: T8) => T9,
): (x: T0) => T9;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
  f6: (x: T6) => T7,
  f7: (x: T7) => T8,
  f8: (x: T8) => T9,
  f9: (x: T9) => T10,
): (x: T0) => T10;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
  f6: (x: T6) => T7,
  f7: (x: T7) => T8,
  f8: (x: T8) => T9,
  f9: (x: T9) => T10,
  f10: (x: T10) => T11,
): (x: T0) => T11;
export function pipeWith<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(
  f0: (x: T0) => T1,
  f1: (x: T1) => T2,
  f2: (x: T2) => T3,
  f3: (x: T3) => T4,
  f4: (x: T4) => T5,
  f5: (x: T5) => T6,
  f6: (x: T6) => T7,
  f7: (x: T7) => T8,
  f8: (x: T8) => T9,
  f9: (x: T9) => T10,
  f10: (x: T10) => T11,
  f11: (x: T11) => T12,
): (x: T0) => T12;
export function pipeWith(
  ...fns: [
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    Unary,
    ...Unary[],
  ]
): Unary;
export function pipeWith(...fns: Unary[]): Unary {
  return chainLtr(fns);
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
export function composeWith<T0, T1, T2, T3, T4, T5>(
  f0: (x: T4) => T5,
  f1: (x: T3) => T4,
  f2: (x: T2) => T3,
  f3: (x: T1) => T2,
  f4: (x: T0) => T1,
): (x: T0) => T5;
export function composeWith<T0, T1, T2, T3, T4, T5, T6>(
  f0: (x: T5) => T6,
  f1: (x: T4) => T5,
  f2: (x: T3) => T4,
  f3: (x: T2) => T3,
  f4: (x: T1) => T2,
  f5: (x: T0) => T1,
): (x: T0) => T6;
export function composeWith<T0, T1, T2, T3, T4, T5, T6, T7>(
  f0: (x: T6) => T7,
  f1: (x: T5) => T6,
  f2: (x: T4) => T5,
  f3: (x: T3) => T4,
  f4: (x: T2) => T3,
  f5: (x: T1) => T2,
  f6: (x: T0) => T1,
): (x: T0) => T7;
export function composeWith<T0, T1, T2, T3, T4, T5, T6, T7, T8>(
  f0: (x: T7) => T8,
  f1: (x: T6) => T7,
  f2: (x: T5) => T6,
  f3: (x: T4) => T5,
  f4: (x: T3) => T4,
  f5: (x: T2) => T3,
  f6: (x: T1) => T2,
  f7: (x: T0) => T1,
): (x: T0) => T8;
export function composeWith(
  ...fns: [Unary, Unary, Unary, Unary, Unary, Unary, Unary, Unary, ...Unary[]]
): Unary;
export function composeWith(...fns: Unary[]): Unary {
  return chainLtr(fns.slice().reverse());
}
