/**
 * Argument/parameter utilities: spread, fill, required.
 */
import { ERROR_ARGUMENT_PREFIX, ERROR_ARGUMENT_REQUIRED_SUFFIX } from "./constants";

export function spreadArgs<T>(args: T[] | IArguments): T[] {
  return Array.from(args);
}

export function fillArgs<T>(template: T[], values: Partial<Record<number, T>>): T[] {
  const out = [...template];
  for (const i of Object.keys(values) as unknown as number[]) {
    if (values[i] !== undefined) out[i] = values[i] as T;
  }
  return out;
}

export function requireArgs<T>(args: (T | null | undefined)[], count: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const v = args[i];
    if (v === null || v === undefined) {
      throw new Error(ERROR_ARGUMENT_PREFIX + (i + 1) + ERROR_ARGUMENT_REQUIRED_SUFFIX);
    }
    out.push(v);
  }
  return out;
}

export function firstArg<T>(args: T[] | IArguments): T | undefined {
  return Array.from(args)[0];
}

export function lastArg<T>(args: T[] | IArguments): T | undefined {
  const a = Array.from(args);
  return a[a.length - 1];
}

export function restArgs<T>(args: T[] | IArguments, from = 1): T[] {
  return Array.from(args).slice(from);
}
