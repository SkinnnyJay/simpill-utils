import type {
  HeartbeatOptions,
  MessageHelpersOptions,
  MessageQueueOptions,
  ReconnectingWebSocketHooks,
  ReconnectingWebSocketState,
  ReconnectingWebSocketStatus,
  ReconnectOptions,
  RetryPolicyOptions,
  SocketLimitsOptions,
} from "../shared";
import {
  ERROR_WS_GENERIC,
  ERROR_WS_NOT_AVAILABLE,
  JITTER_MODE_NONE,
  WS_READY_STATE,
  WS_RECONNECT_STATUS,
} from "../shared/constants";
import { defaultIsPong, runHeartbeat } from "./heartbeat-helpers";
import { createMessageQueue, type MessageQueue } from "./message-queue";
import {
  applyJitter,
  computeReconnectDelay,
  DEFAULT_BACKOFF_MULTIPLIER,
  DEFAULT_INITIAL_DELAY_MS,
  DEFAULT_JITTER_RATIO,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_MAX_DELAY_MS,
} from "./reconnect-helpers";

export interface CreateReconnectingWebSocketOptions {
  reconnect?: ReconnectOptions;
  heartbeat?: HeartbeatOptions;
  WebSocketCtor?: typeof WebSocket;
  signal?: AbortSignal;
  /** If false, must call open() to connect. Default true */
  autoConnect?: boolean;
  hooks?: ReconnectingWebSocketHooks;
  limits?: SocketLimitsOptions;
  queue?: MessageQueueOptions;
  retryPolicy?: RetryPolicyOptions;
  message?: MessageHelpersOptions;
}

export interface ReconnectingWebSocketResult {
  /** Undefined until open() is called when autoConnect is false. */
  ws: WebSocket | undefined;
  reconnect: () => void;
  close: () => void;
  /** Call only when autoConnect is false to start first connection. */
  open: () => void;
  getState: () => Readonly<ReconnectingWebSocketState>;
  /** Send data (queued if not open when queue enabled). */
  send: (data: string | unknown) => void;
}

export function createReconnectingWebSocket(
  url: string,
  options?: CreateReconnectingWebSocketOptions,
): ReconnectingWebSocketResult {
  const WebSocketCtor = options?.WebSocketCtor ?? globalThis.WebSocket;
  if (!WebSocketCtor) {
    throw new Error(ERROR_WS_NOT_AVAILABLE);
  }

  const reconnectOpts = options?.reconnect ?? {};
  const maxAttempts = reconnectOpts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const initialDelayMs = reconnectOpts.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelayMs = reconnectOpts.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const backoffMultiplier = reconnectOpts.backoffMultiplier ?? DEFAULT_BACKOFF_MULTIPLIER;
  const jitter = reconnectOpts.jitter ?? JITTER_MODE_NONE;
  const jitterRatio = reconnectOpts.jitterRatio ?? DEFAULT_JITTER_RATIO;
  const signal = options?.signal;
  const hooks = options?.hooks;
  const limits = options?.limits;
  const queueOpts = options?.queue;
  const retryPolicy = options?.retryPolicy;
  const messageHelpers = options?.message;
  const autoConnect = options?.autoConnect !== false;

  const state: ReconnectingWebSocketState = {
    status: WS_RECONNECT_STATUS.IDLE as ReconnectingWebSocketStatus,
    lastError: null,
    lastOpenAt: null,
    lastCloseAt: null,
    attemptCount: 0,
    reconnectAttempt: 0,
  };

  let ws: WebSocket | undefined;
  let reconnectAttempt = 0;
  let firstConnectAt: number | null = null;
  let heartbeatRunner: ReturnType<typeof runHeartbeat> | null = null;
  let closed = false;
  let manualReconnect = false;
  let reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  let reconnectAbortListener: (() => void) | null = null;
  let idleTimerId: ReturnType<typeof setTimeout> | null = null;
  let maxUptimeTimerId: ReturnType<typeof setTimeout> | null = null;

  const messageQueue: MessageQueue | null =
    queueOpts?.enabled === true ? createMessageQueue(queueOpts) : null;

  function setStatus(s: ReconnectingWebSocketStatus): void {
    state.status = s;
  }

  function clearReconnectTimer(): void {
    if (reconnectTimerId !== null) {
      clearTimeout(reconnectTimerId);
      reconnectTimerId = null;
    }
    if (reconnectAbortListener && signal) {
      signal.removeEventListener("abort", reconnectAbortListener);
      reconnectAbortListener = null;
    }
  }

  function clearIdleAndUptime(): void {
    if (idleTimerId !== null) {
      clearTimeout(idleTimerId);
      idleTimerId = null;
    }
    if (maxUptimeTimerId !== null) {
      clearTimeout(maxUptimeTimerId);
      maxUptimeTimerId = null;
    }
  }

  function scheduleReconnect(delayMs: number): void {
    clearReconnectTimer();
    if (signal?.aborted) return;
    const elapsed = firstConnectAt !== null ? Date.now() - firstConnectAt : 0;
    if (retryPolicy?.maxElapsedMs !== undefined && elapsed >= retryPolicy.maxElapsedMs) return;
    const jittered = Math.max(1, applyJitter(delayMs, jitter, jitterRatio));
    hooks?.onReconnect?.(reconnectAttempt, jittered);
    reconnectTimerId = setTimeout(() => {
      reconnectTimerId = null;
      if (reconnectAbortListener && signal) {
        signal.removeEventListener("abort", reconnectAbortListener);
        reconnectAbortListener = null;
      }
      connect();
    }, jittered);
    if (signal) {
      reconnectAbortListener = () => clearReconnectTimer();
      signal.addEventListener("abort", reconnectAbortListener, { once: true });
    }
  }

  function clearHeartbeat(): void {
    heartbeatRunner?.clear();
    heartbeatRunner = null;
  }

  function startIdleTimer(): void {
    if (!limits?.idleMs) return;
    if (idleTimerId) clearTimeout(idleTimerId);
    idleTimerId = setTimeout(() => {
      idleTimerId = null;
      ws?.close();
    }, limits.idleMs);
  }

  function startMaxUptimeTimer(): void {
    if (!limits?.maxUptimeMs) return;
    if (maxUptimeTimerId) clearTimeout(maxUptimeTimerId);
    maxUptimeTimerId = setTimeout(() => {
      maxUptimeTimerId = null;
      ws?.close();
    }, limits.maxUptimeMs);
  }

  function startHeartbeat(heartbeat: HeartbeatOptions): void {
    clearHeartbeat();
    heartbeatRunner = runHeartbeat(
      heartbeat,
      () => (ws?.readyState === WS_READY_STATE.OPEN ? ws : undefined),
      (data) => ws?.send(data),
      () => ws?.close(),
    );
  }

  function flushQueue(): void {
    if (ws?.readyState !== WS_READY_STATE.OPEN || !messageQueue || messageQueue.length() === 0)
      return;
    messageQueue.flush((data) => ws?.send(data));
  }

  function connect(): void {
    if (closed) return;
    if (firstConnectAt === null) firstConnectAt = Date.now();
    setStatus(WS_RECONNECT_STATUS.CONNECTING);
    state.attemptCount++;
    const socket = new WebSocketCtor(url);
    ws = socket;

    socket.onopen = (ev) => {
      setStatus(WS_RECONNECT_STATUS.OPEN);
      state.lastOpenAt = Date.now();
      state.lastError = null;
      clearIdleAndUptime();
      startIdleTimer();
      startMaxUptimeTimer();
      const hb = options?.heartbeat;
      if (hb) startHeartbeat(hb);
      flushQueue();
      hooks?.onOpen?.(ev);
    };

    socket.onmessage = (ev) => {
      startIdleTimer();
      const hb = options?.heartbeat;
      if (hb?.expectPong && (hb.isPong ?? defaultIsPong)(ev.data)) {
        heartbeatRunner?.clearPongTimeout();
        heartbeatRunner?.resetMisses();
      }
      hooks?.onMessage?.(ev);
    };

    socket.onclose = (ev) => {
      setStatus(WS_RECONNECT_STATUS.CLOSED);
      state.lastCloseAt = Date.now();
      state.reconnectAttempt = reconnectAttempt;
      clearHeartbeat();
      clearReconnectTimer();
      clearIdleAndUptime();
      hooks?.onClose?.(ev);

      if (manualReconnect) {
        manualReconnect = false;
        connect();
        return;
      }

      const should =
        retryPolicy?.shouldReconnect?.({ attempt: reconnectAttempt, closeEvent: ev }) ?? true;
      if (!should || reconnectAttempt >= maxAttempts) return;

      setStatus(WS_RECONNECT_STATUS.RECONNECTING);
      reconnectAttempt++;
      const delayMs = computeReconnectDelay(
        reconnectAttempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
      );
      scheduleReconnect(delayMs);
    };

    socket.onerror = (ev) => {
      state.lastError = new Error(ERROR_WS_GENERIC);
      hooks?.onError?.(ev);
    };
  }

  function send(data: string | unknown): void {
    const serialized =
      typeof data === "string"
        ? data
        : messageHelpers?.serialize
          ? messageHelpers.serialize(data)
          : JSON.stringify(data);

    if (messageQueue && ws?.readyState !== WS_READY_STATE.OPEN) {
      messageQueue.push(serialized);
      return;
    }
    if (ws?.readyState === WS_READY_STATE.OPEN) ws.send(serialized);
  }

  function open(): void {
    if (state.status !== WS_RECONNECT_STATUS.IDLE) return;
    connect();
  }

  if (autoConnect) connect();
  else setStatus(WS_RECONNECT_STATUS.IDLE);

  return {
    get ws(): WebSocket | undefined {
      return ws;
    },
    reconnect() {
      closed = false;
      reconnectAttempt = 0;
      clearReconnectTimer();
      if (
        ws !== undefined &&
        (ws.readyState === WS_READY_STATE.OPEN || ws.readyState === WS_READY_STATE.CONNECTING)
      ) {
        manualReconnect = true;
        ws.close();
        return;
      }
      connect();
    },
    close() {
      closed = true;
      manualReconnect = false;
      clearReconnectTimer();
      clearHeartbeat();
      clearIdleAndUptime();
      if (
        ws !== undefined &&
        ws.readyState !== WS_READY_STATE.CLOSED &&
        ws.readyState !== WS_READY_STATE.CLOSING
      ) {
        ws.close();
      }
    },
    open,
    getState: () => ({ ...state }),
    send,
  };
}
