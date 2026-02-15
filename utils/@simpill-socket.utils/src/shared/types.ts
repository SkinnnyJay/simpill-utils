/** Reconnect backoff and jitter. */
export interface ReconnectOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  /** "none" | "full" | "equal" - jitter applied to delay before reconnect */
  jitter?: "none" | "full" | "equal";
  /** 0–1; used when jitter is "equal" for min/max range. Default 0.5 */
  jitterRatio?: number;
}

/** Heartbeat ping and optional pong detection. */
export interface HeartbeatOptions {
  intervalMs: number;
  message?: string | (() => string);
  timeoutMs?: number;
  /** When true, expect pong replies and close after maxMisses without pong */
  expectPong?: boolean;
  pongTimeoutMs?: number;
  maxMisses?: number;
  /** (data) => boolean; default treats string "pong" or { type: "pong" } as pong */
  isPong?: (data: unknown) => boolean;
}

/** Idle / max-uptime limits; auto-close when exceeded. */
export interface SocketLimitsOptions {
  /** Close after no message received/sent for this many ms */
  idleMs?: number;
  /** Close after socket has been open for this many ms */
  maxUptimeMs?: number;
}

/** Outbound message queue until open. */
export interface MessageQueueOptions {
  enabled?: boolean;
  maxSize?: number;
  ttlMs?: number;
  onDrop?: (count: number) => void;
}

/** Retry policy: whether to reconnect and optional max elapsed time. */
export interface RetryPolicyOptions {
  shouldReconnect?: (info: { attempt: number; closeEvent?: CloseEvent; error?: Event }) => boolean;
  maxElapsedMs?: number;
}

/** Typed message serialize/parse/validate. */
export interface MessageHelpersOptions {
  serialize?: (value: unknown) => string;
  parse?: (raw: string) => unknown;
  validate?: (data: unknown) => boolean;
}

/** Connection state exposed by reconnecting WebSocket. */
export type ReconnectingWebSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "reconnecting";

export interface ReconnectingWebSocketState {
  status: ReconnectingWebSocketStatus;
  lastError: Error | null;
  lastOpenAt: number | null;
  lastCloseAt: number | null;
  attemptCount: number;
  reconnectAttempt: number;
}

/** Lifecycle and message event hooks. */
export interface ReconnectingWebSocketHooks {
  onOpen?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
  onReconnect?: (attempt: number, delayMs: number) => void;
  onMessage?: (ev: MessageEvent) => void;
  onError?: (ev: Event) => void;
}
