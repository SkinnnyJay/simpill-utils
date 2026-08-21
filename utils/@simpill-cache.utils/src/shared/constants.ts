/** Shared constants for cache.utils (literal audit). */
export const VALUE_0 = 0;

export const ERROR_MAX_SIZE_MUST_BE_POSITIVE = "maxSize must be positive" as const;
export const ERROR_MAX_SIZE_MUST_BE_POSITIVE_FINITE =
  "maxSize must be a positive finite number" as const;
export const ERROR_TTL_MS_MUST_BE_POSITIVE = "ttlMs must be positive" as const;

export const ERROR_TTL_MS_MUST_BE_A_NUMBER = "ttlMs must be a number (NaN rejected)" as const;

export const ERROR_SWR_REQUIRES_TTL = "staleWhileRevalidateMs requires ttlMs to be set" as const;
export const ERROR_SWR_CUSTOM_CACHE =
  "staleWhileRevalidateMs is not compatible with a custom cache" as const;
