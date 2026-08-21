import type { MessageQueueOptions } from "../shared";

export interface QueuedMessage {
  data: string;
  ts: number;
}

export interface MessageQueue {
  push: (data: string) => void;
  flush: (sendFn: (data: string) => void) => void;
  /** Current number of queued messages (for tests / backpressure). */
  length: () => number;
  /** Drop all queued messages without sending. */
  clear: () => void;
}

/**
 * Create an outbound message queue with optional TTL and max size.
 * Used when socket is not open; flush when socket opens.
 *
 * Implementation: head-index FIFO over a plain array. Array#shift is O(n)
 * (every removal reindexes the tail), which made drop-oldest churn and
 * flush O(n^2) on large queues. A head pointer makes dequeue O(1); the
 * backing array is compacted once half of it is dead space, keeping
 * memory bounded at <= 2x live entries (amortized O(1) per operation).
 */
export function createMessageQueue(opts: MessageQueueOptions = {}): MessageQueue {
  let queue: QueuedMessage[] = [];
  let head = 0;
  const maxSize = opts.maxSize;
  const ttlMs = opts.ttlMs;
  const onDrop = opts.onDrop;

  function size(): number {
    return queue.length - head;
  }

  function compactIfNeeded(): void {
    if (head > 32 && head * 2 >= queue.length) {
      queue = queue.slice(head);
      head = 0;
    }
  }

  function dequeue(): QueuedMessage | undefined {
    if (head >= queue.length) return undefined;
    const entry = queue[head];
    queue[head] = undefined as unknown as QueuedMessage; // release for GC
    head++;
    compactIfNeeded();
    return entry;
  }

  /** Drop expired entries from the front; returns count dropped. */
  function evictExpired(now: number): number {
    if (ttlMs === undefined) return 0;
    let dropped = 0;
    while (head < queue.length && now - queue[head].ts > ttlMs) {
      queue[head] = undefined as unknown as QueuedMessage;
      head++;
      dropped++;
    }
    compactIfNeeded();
    return dropped;
  }

  function push(data: string): void {
    const now = Date.now();
    let dropped = evictExpired(now);
    if (maxSize !== undefined && maxSize <= 0) {
      // A zero-capacity queue can never hold the incoming message.
      onDrop?.(dropped + 1);
      return;
    }
    if (maxSize !== undefined) {
      while (size() >= maxSize) {
        if (dequeue() === undefined) break;
        dropped++;
      }
    }
    if (dropped > 0) onDrop?.(dropped);
    queue.push({ data, ts: now });
  }

  function flush(sendFn: (data: string) => void): void {
    const now = Date.now();
    let entry = dequeue();
    while (entry !== undefined) {
      if (ttlMs === undefined || now - entry.ts <= ttlMs) {
        try {
          sendFn(entry.data);
        } catch {
          // ignore send errors during flush
        }
      }
      entry = dequeue();
    }
  }

  function clear(): void {
    queue = [];
    head = 0;
  }

  return { push, flush, length: size, clear };
}
