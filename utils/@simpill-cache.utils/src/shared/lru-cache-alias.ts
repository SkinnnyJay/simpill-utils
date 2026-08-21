/**
 * Re-exports the O(1) doubly-linked-list LRU implementation from @simpill/collections.utils
 * as the canonical high-performance LRU. This is preferred over LRUMap when O(1) access
 * reordering matters.
 *
 * Canonical implementation: @simpill/collections.utils → LRUCache
 * Convenience alias: @simpill/cache.utils → LRUCache (this file)
 */
export { LRUCache, type LRUCacheOptions } from "@simpill/collections.utils";
