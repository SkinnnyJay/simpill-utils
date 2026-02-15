export const DEFAULT_SEED = 42;

export const FAKE = {
  STRING_LENGTH: 10,
  EMAIL_DOMAIN: "example.com",
  MIN_NUMBER: 0,
  MAX_NUMBER: 1000,
} as const;

/** FakerWrapper.pick: array must not be empty. */
export const ERROR_FAKER_PICK_EMPTY = "FakerWrapper.pick: array must not be empty" as const;
