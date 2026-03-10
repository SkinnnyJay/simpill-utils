/**
 * Server-only error messages for RedisCache. Not part of public API.
 */
export const ERROR_REDIS_UNDEFINED = "RedisCache does not support storing undefined" as const;
export const ERROR_REDIS_NON_STRING = "RedisCache serialization produced non-string value" as const;
export const ERROR_REDIS_INVALID_JSON_PREFIX = "RedisCache: invalid JSON for key " as const;
export const ERROR_REDIS_INVALID_JSON_SEP = ": " as const;
