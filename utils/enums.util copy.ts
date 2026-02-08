// Get enum values (string enum only)
function getEnumValues<T extends Record<string, string>>(enumObj: T): T[keyof T][] {
  return Object.values(enumObj) as T[keyof T][];
}

// Get enum value with optional default
export function getEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string
): T[keyof T] | undefined;

export function getEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string,
  defaultValue: T[keyof T]
): T[keyof T];

export function getEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string,
  defaultValue?: T[keyof T]
): T[keyof T] | undefined {
  const values = getEnumValues(enumObj);
  return values.includes(value as T[keyof T]) ? (value as T[keyof T]) : defaultValue || undefined;
}

// Enum value validator
export function isValidEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string
): value is T[keyof T] {
  return getEnumValues(enumObj).includes(value as T[keyof T]) || false;
}

// Backwards compatible export
export const EnumHelper = {
  getEnumValue,
  isValidEnumValue,
} as const;
