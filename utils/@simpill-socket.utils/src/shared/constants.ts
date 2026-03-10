/** Shared constants for socket.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_2 = 2;
export const VALUE_3 = 3;
export const VALUE_5 = 5;
export const VALUE_10 = 10;
export const VALUE_30 = 30;
export const VALUE_50 = 50;
export const VALUE_80 = 80;
export const VALUE_1_5 = 1.5;
export const TIMEOUT_MS_1000 = 1000;
export const TIMEOUT_MS_3000 = 3000;
export const TIMEOUT_MS_5000 = 5000;
export const TIMEOUT_MS_30000 = 30000;

/** WebSocket readyState values (standard). */
export const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

/** Error: WebSocket constructor not available. */
export const ERROR_WS_NOT_AVAILABLE =
  "WebSocket is not available; pass WebSocketCtor in options" as const;
/** Error: generic WebSocket error event. */
export const ERROR_WS_GENERIC = "WebSocket error" as const;

/** Jitter mode for reconnect delay. */
export const JITTER_MODE_NONE = "none" as const;
export const JITTER_MODE_FULL = "full" as const;
export const JITTER_MODE_EQUAL = "equal" as const;

/** Pong message/type for heartbeat (string or object.type). */
export const PONG_VALUE = "pong" as const;

/** Reconnecting WebSocket status values (for setStatus/getState). */
export const WS_RECONNECT_STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  OPEN: "open",
  CLOSING: "closing",
  CLOSED: "closed",
  RECONNECTING: "reconnecting",
} as const;

/** Heartbeat: default pong timeout (ms). */
export const HEARTBEAT_DEFAULT_PONG_TIMEOUT_MS = 5000;
/** Heartbeat: default max missed pongs before close. */
export const HEARTBEAT_DEFAULT_MAX_MISSES = 3;
