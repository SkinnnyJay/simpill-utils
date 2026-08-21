/**
 * Enum helpers for string, numeric, heterogeneous TypeScript enums and
 * `as const` objects.
 *
 * Compiled numeric enums carry reverse mappings ({ A: 0, "0": "A" }), so a
 * naive Object.values() check accepts member NAMES as values (TS#57134).
 * All helpers here filter reverse-mapping artifacts and cache the member
 * table per enum object in a WeakMap, so validation and reverse lookup are
 * O(1) and allocation-free after the first call.
 *
 * Matching is strict (===): for numeric enums, 0 is valid but "0" is not.
 */

type EnumLike = Record<string, string | number>;

interface EnumTable<T extends EnumLike> {
  readonly keys: readonly (keyof T & string)[];
  readonly values: readonly T[keyof T][];
  readonly valueSet: ReadonlySet<T[keyof T]>;
  readonly keyByValue: ReadonlyMap<T[keyof T], keyof T & string>;
}

const tableCache = new WeakMap<EnumLike, EnumTable<EnumLike>>();

/**
 * True iff `key` is a reverse-mapping artifact of a compiled numeric enum:
 * its value is a member NAME whose member value stringifies back to `key`.
 * The round-trip check keeps hostile const objects like { a: "b", b: 1 }
 * intact (obj[obj.a] === 1, but String(1) !== "a", so "a" is a real member).
 */
function isReverseMappingKey(enumObj: EnumLike, key: string): boolean {
  const value = enumObj[key];
  if (typeof value !== "string") return false;
  const roundTrip = enumObj[value];
  return typeof roundTrip === "number" && String(roundTrip) === key;
}

// Last-hit memo: hot loops validate against a single enum, so a reference
// check beats a WeakMap lookup on every call after the first.
let lastEnumObj: EnumLike | undefined;
let lastTable: EnumTable<EnumLike> | undefined;

function getTable<T extends EnumLike>(enumObj: T): EnumTable<T> {
  if (enumObj === lastEnumObj) return lastTable as unknown as EnumTable<T>;
  const cached = tableCache.get(enumObj);
  if (cached) {
    lastEnumObj = enumObj;
    lastTable = cached;
    return cached as unknown as EnumTable<T>;
  }

  const keys: (keyof T & string)[] = [];
  const values: T[keyof T][] = [];
  const valueSet = new Set<T[keyof T]>();
  const keyByValue = new Map<T[keyof T], keyof T & string>();

  for (const key of Object.keys(enumObj)) {
    if (isReverseMappingKey(enumObj, key)) continue;
    const value = enumObj[key] as T[keyof T];
    keys.push(key);
    values.push(value);
    valueSet.add(value);
    if (!keyByValue.has(value)) keyByValue.set(value, key);
  }

  const table: EnumTable<T> = { keys, values, valueSet, keyByValue };
  tableCache.set(enumObj, table as unknown as EnumTable<EnumLike>);
  lastEnumObj = enumObj;
  lastTable = table as unknown as EnumTable<EnumLike>;
  return table;
}

/** Thrown by assertEnumValue when a value is not a member of the enum. */
export class InvalidEnumValueError extends Error {
  readonly received: unknown;
  readonly allowed: readonly (string | number)[];

  constructor(received: unknown, allowed: readonly (string | number)[], label?: string) {
    const shown =
      typeof received === "string"
        ? JSON.stringify(received)
        : typeof received === "number" || typeof received === "boolean"
          ? String(received)
          : Object.prototype.toString.call(received);
    super(
      `Invalid ${label ?? "enum value"}: ${shown}. Expected one of: ${allowed
        .map((v) => (typeof v === "string" ? JSON.stringify(v) : String(v)))
        .join(", ")}`,
    );
    this.name = "InvalidEnumValueError";
    this.received = received;
    this.allowed = allowed;
  }
}

/** Member values (reverse-mapping safe, fresh array per call). */
export function enumValues<T extends EnumLike>(enumObj: T): T[keyof T][] {
  return getTable(enumObj).values.slice();
}

/** Member keys (reverse-mapping safe, fresh array per call). */
export function enumKeys<T extends EnumLike>(enumObj: T): (keyof T & string)[] {
  return getTable(enumObj).keys.slice();
}

/** Member [key, value] pairs (reverse-mapping safe, fresh array per call). */
export function enumEntries<T extends EnumLike>(enumObj: T): [keyof T & string, T[keyof T]][] {
  const { keys } = getTable(enumObj);
  return keys.map((key) => [key, enumObj[key] as T[keyof T]]);
}

// Get enum value with optional default
export function getEnumValue<T extends EnumLike>(
  enumObj: T,
  value: string | number,
): T[keyof T] | undefined;

export function getEnumValue<T extends EnumLike>(
  enumObj: T,
  value: string | number,
  defaultValue: T[keyof T],
): T[keyof T];

export function getEnumValue<T extends EnumLike>(
  enumObj: T,
  value: string | number,
  defaultValue?: T[keyof T],
): T[keyof T] | undefined {
  return getTable(enumObj).valueSet.has(value as T[keyof T])
    ? (value as T[keyof T])
    : (defaultValue as T[keyof T] | undefined);
}

// Enum value validator
export function isValidEnumValue<T extends EnumLike>(
  enumObj: T,
  value: unknown,
): value is T[keyof T] {
  return getTable(enumObj).valueSet.has(value as T[keyof T]);
}

/** Type guard for member KEYS (reverse-mapping keys of numeric enums are not member keys). */
export function isEnumKey<T extends EnumLike>(enumObj: T, key: unknown): key is keyof T & string {
  if (typeof key !== "string") return false;
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn needs lib ES2022; tsconfig targets ES2020 (unchanged per house rules)
  return Object.prototype.hasOwnProperty.call(enumObj, key) && !isReverseMappingKey(enumObj, key);
}

// Reverse lookup: member key from value (works for string enums too)
export function getEnumKey<T extends EnumLike>(
  enumObj: T,
  value: string | number,
): (keyof T & string) | undefined;

export function getEnumKey<T extends EnumLike>(
  enumObj: T,
  value: string | number,
  defaultKey: keyof T & string,
): keyof T & string;

export function getEnumKey<T extends EnumLike>(
  enumObj: T,
  value: string | number,
  defaultKey?: keyof T & string,
): (keyof T & string) | undefined {
  return getTable(enumObj).keyByValue.get(value as T[keyof T]) ?? defaultKey;
}

/** Validate-or-throw: returns the value typed as a member, or throws InvalidEnumValueError. */
export function assertEnumValue<T extends EnumLike>(
  enumObj: T,
  value: unknown,
  label?: string,
): T[keyof T] {
  const table = getTable(enumObj);
  if (table.valueSet.has(value as T[keyof T])) return value as T[keyof T];
  throw new InvalidEnumValueError(value, table.values, label);
}

// Backwards compatible export
export const EnumHelper = {
  getEnumValue,
  isValidEnumValue,
  getEnumKey,
  isEnumKey,
  enumValues,
  enumKeys,
  enumEntries,
  assertEnumValue,
} as const;
