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
}

/**
 * Create an outbound message queue with optional TTL and max size.
 * Used when socket is not open; flush when socket opens.
 */
export function createMessageQueue(opts: MessageQueueOptions = {}): MessageQueue {
  const queue: QueuedMessage[] = [];
  const maxSize = opts.maxSize;
  const ttlMs = opts.ttlMs;
  const onDrop = opts.onDrop;

  function push(data: string): void {
    if (maxSize !== undefined && queue.length >= maxSize) {
      const drop = queue.length - maxSize + 1;
      for (let i = 0; i < drop; i++) queue.shift();
      onDrop?.(drop);
    }
    queue.push({ data, ts: Date.now() });
  }

  function flush(sendFn: (data: string) => void): void {
    const now = Date.now();
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) break;
      if (ttlMs !== undefined && now - entry.ts > ttlMs) continue;
      try {
        sendFn(entry.data);
      } catch {
        // ignore send errors during flush
      }
    }
  }

  function length(): number {
    return queue.length;
  }

  return { push, flush, length };
}
