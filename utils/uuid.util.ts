import { validate as uuidValidate, v4 as uuidv4 } from "uuid";

export function generateUUID(): string {
  return uuidv4();
}

export function validateUUID(uuid: string): boolean {
  return uuidValidate(uuid);
}

export function isUUID(uuid: string): boolean {
  return uuidValidate(uuid);
}

export function compareUUIDs(uuid1: string, uuid2: string): boolean {
  return uuid1 === uuid2;
}

// Backwards compatible export
export const UUIDHelper = {
  generateUUID,
  validateUUID,
  isUUID,
  compareUUIDs,
} as const;
