import { validate as uuidValidate, v1 as uuidv1, v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { VALUE_0 } from "./constants";

/** RFC 4122 v4 (random) UUID. */
export function generateUUID(): string {
  return uuidv4();
}

/** Alias for generateUUID (v4). */
export function generateUUIDv4(): string {
  return uuidv4();
}

/** RFC 4122 v1 (time-based) UUID. */
export function generateUUIDv1(): string {
  return uuidv1();
}

/** RFC 4122 v5 (namespace + name, SHA-1). Use NAMESPACE_DNS etc. from uuid for namespace. */
export function generateUUIDv5(name: string, namespace: string): string {
  return uuidv5(name, namespace);
}

/** True if string is valid RFC 4122 UUID. */
export function validateUUID(uuid: string): boolean {
  return uuidValidate(uuid);
}

/** Alias for validateUUID. */
export function isUUID(uuid: string): boolean {
  return uuidValidate(uuid);
}

/** Returns string if valid UUID, else null (parse + validate in one call). */
export function parseUUID(value: string): string | null {
  if (typeof value !== "string" || value.length === VALUE_0) return null;
  return uuidValidate(value) ? value : null;
}

/** True if two UUID strings are equal (case-sensitive). */
export function compareUUIDs(uuid1: string, uuid2: string): boolean {
  return uuid1 === uuid2;
}

export const UUIDHelper = {
  generateUUID,
  generateUUIDv1,
  generateUUIDv4,
  generateUUIDv5,
  validateUUID,
  isUUID,
  parseUUID,
  compareUUIDs,
} as const;
