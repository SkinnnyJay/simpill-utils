/**
 * Type-level utilities for object manipulation and safer object definitions.
 * Use these in type positions only; they do not emit runtime code.
 */

/** Makes specified keys K of T optional; all others remain required. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Makes specified keys K of T required; all others remain as-is. */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Recursively makes all properties of T optional. */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/** Recursively makes all properties of T required (no optional/undefined). */
export type DeepRequired<T> = T extends object ? { [P in keyof T]-?: DeepRequired<T[P]> } : T;

/** Extracts only string keys from T. */
export type StringKeys<T> = Extract<keyof T, string>;

/** Extracts only number/symbol keys from T (excludes string). */
export type NonStringKeys<T> = Exclude<keyof T, string>;

/** Object type with string index signature and optional known keys. */
export type RecordWithKnownKeys<K extends string, V> = Record<K, V> & Record<string, V>;

/** Values of T as a union type. */
export type ValueOf<T> = T[keyof T];

/** Entries of T as [key, value] tuples. */
export type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];

/** Keys of T that map to values of type V. */
export type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

/** Strict record: only specified keys are allowed. */
export type StrictRecord<K extends string | number | symbol, V> = {
  [P in K]: V;
};

/** Readonly at top level only (shallow). */
export type ReadonlyShallow<T> = { readonly [P in keyof T]: T[P] };

/** Mutable copy of T (removes readonly). */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/** Recursively readonly. */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/** Path as dot-separated string for nested access (simplified; for typing get/set). */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : undefined
  : P extends keyof T
    ? T[P]
    : undefined;
