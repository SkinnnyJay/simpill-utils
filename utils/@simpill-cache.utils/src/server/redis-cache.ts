import {
  ERROR_REDIS_INVALID_JSON_PREFIX,
  ERROR_REDIS_INVALID_JSON_SEP,
  ERROR_REDIS_NON_STRING,
  ERROR_REDIS_UNDEFINED,
} from "./internal-constants";

/** Redis-backed cache; use with ioredis, node-redis, or any RedisCacheAdapter. */
export interface RedisCacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { px?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

const PREFIX = "cache";

/** Redis cache: string keys, JSON values; optional TTL (ms). */
export class RedisCache<V> {
  private readonly adapter: RedisCacheAdapter;
  private readonly keyPrefix: string;
  private readonly defaultTtlMs: number | undefined;
  /**
   * Optional validator applied to every value retrieved from Redis. Without a validator the
   * return type is an unchecked cast — pass a Zod schema's `.parse` or any `(unknown) => V`
   * type guard to enable runtime shape validation.
   */
  private readonly validate: ((value: unknown) => V) | undefined;

  constructor(
    adapter: RedisCacheAdapter,
    options: { keyPrefix?: string; defaultTtlMs?: number; validate?: (value: unknown) => V } = {}
  ) {
    this.adapter = adapter;
    this.keyPrefix = options.keyPrefix ?? PREFIX;
    this.defaultTtlMs = options.defaultTtlMs;
    this.validate = options.validate;
  }

  private toKey(id: string): string {
    return `${this.keyPrefix}:${id}`;
  }

  async set(key: string, value: V, ttlMs?: number): Promise<void> {
    if (value === undefined) {
      throw new TypeError(ERROR_REDIS_UNDEFINED);
    }
    const k = this.toKey(key);
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string") {
      throw new TypeError(ERROR_REDIS_NON_STRING);
    }
    const ms = ttlMs ?? this.defaultTtlMs;
    if (ms !== undefined) {
      await this.adapter.set(k, serialized, { px: ms });
    } else {
      await this.adapter.set(k, serialized);
    }
  }

  /**
   * Get value by key. When constructed with a `validate` option the parsed value is passed
   * through the validator; otherwise the return type is an unchecked cast — pass a Zod
   * schema's `.parse` or any `(unknown) => V` type guard via constructor options for safe
   * runtime validation.
   */
  async get(key: string): Promise<V | undefined> {
    const k = this.toKey(key);
    const raw = await this.adapter.get(k);
    if (raw === null) return undefined;
    try {
      const parsed: unknown = JSON.parse(raw);
      return this.validate ? this.validate(parsed) : (parsed as V);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        ERROR_REDIS_INVALID_JSON_PREFIX + key + ERROR_REDIS_INVALID_JSON_SEP + message
      );
    }
  }

  async has(key: string): Promise<boolean> {
    const v = await this.get(key);
    return v !== undefined;
  }

  async delete(key: string): Promise<boolean> {
    await this.adapter.del(this.toKey(key));
    return true;
  }
}
