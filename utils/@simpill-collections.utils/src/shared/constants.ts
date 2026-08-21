/** Shared constants for collections.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const TIMEOUT_MS_1000 = 1000;

export const ERROR_TTL_CACHE_TTL_MS = "TTLCache ttlMs must be >= 0" as const;
export const ERROR_LRU_CACHE_MAX_SIZE = "LRUCache maxSize must be >= 1" as const;
export const ERROR_CIRCULAR_BUFFER_CAPACITY = "CircularBuffer capacity must be >= 1" as const;
