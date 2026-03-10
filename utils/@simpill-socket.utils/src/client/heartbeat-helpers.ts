import type { HeartbeatOptions } from "../shared";
import {
  HEARTBEAT_DEFAULT_MAX_MISSES,
  HEARTBEAT_DEFAULT_PONG_TIMEOUT_MS,
  PONG_VALUE,
} from "../shared/constants";

export function defaultIsPong(data: unknown): boolean {
  if (typeof data === "string") return data === PONG_VALUE;
  if (data && typeof data === "object" && "type" in data)
    return (data as { type: string }).type === PONG_VALUE;
  return false;
}

export interface HeartbeatRunner {
  clear: () => void;
  clearPongTimeout: () => void;
  resetMisses: () => void;
}

/**
 * Start heartbeat interval and optional pong timeout. Returns runner with clear() to stop.
 */
export function runHeartbeat(
  heartbeat: HeartbeatOptions,
  getReadyWs: () => WebSocket | undefined,
  sendFn: (data: string) => void,
  onTooManyMisses: () => void,
): HeartbeatRunner {
  const pongTimeoutMs = heartbeat.pongTimeoutMs ?? HEARTBEAT_DEFAULT_PONG_TIMEOUT_MS;
  const maxMisses = heartbeat.maxMisses ?? HEARTBEAT_DEFAULT_MAX_MISSES;
  const expectPong = heartbeat.expectPong === true;
  const isPong = heartbeat.isPong ?? defaultIsPong;

  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let pongTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pongMisses = 0;

  function clearPongTimeout(): void {
    if (pongTimeoutId !== null) {
      clearTimeout(pongTimeoutId);
      pongTimeoutId = null;
    }
  }

  function resetMisses(): void {
    pongMisses = 0;
  }

  function clear(): void {
    if (heartbeatId !== null) {
      clearInterval(heartbeatId);
      heartbeatId = null;
    }
    clearPongTimeout();
    pongMisses = 0;
  }

  heartbeatId = setInterval(() => {
    const socket = getReadyWs();
    if (!socket) return;
    const msg =
      typeof heartbeat.message === "function" ? heartbeat.message() : (heartbeat.message ?? "");
    if (msg) sendFn(msg);
    if (expectPong) {
      clearPongTimeout();
      pongTimeoutId = setTimeout(() => {
        pongTimeoutId = null;
        pongMisses++;
        if (pongMisses >= maxMisses) onTooManyMisses();
      }, pongTimeoutMs);
    }
  }, heartbeat.intervalMs);

  return {
    clear,
    clearPongTimeout,
    resetMisses,
  };
}
