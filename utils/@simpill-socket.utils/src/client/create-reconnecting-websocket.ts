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
  JITTER_MODE_DECORRELATED,
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
  DEFAULT_MIN_UPTIME_MS,
  decorrelatedJitter,
} from "./reconnect-helpers";

/** URL as a string, or a (possibly async) provider called before every connection attempt. */
export type UrlProvider = string | (() => string) | (() => Promise<string>);

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
  /** WebSocket subprotocol(s), passed to the constructor on every attempt. */
  protocols?: string | string[];
}

export interface ReconnectingWebSocketResult {
  /** Undefined until open() is called when autoConnect is false. */
  ws: WebSocket | undefined;
  reconnect: () => void;
  /** Close and stop reconnecting. Optional code/reason are forwarded to WebSocket#close. */
  close: (code?: number, reason?: string) => void;
  /** Call only when autoConnect is false to start first connection. */
  open: () => void;
  getState: () => Readonly<ReconnectingWebSocketState>;
  /**
   * Send data. Returns true when the data was sent or queued; false when it
   * was dropped (socket not open and queueing disabled).
   */
  send: (data: string | unknown) => boolean;
}

export function createReconnectingWebSocket(
  url: UrlProvider,
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
  const minUptimeMs = reconnectOpts.minUptimeMs ?? DEFAULT_MIN_UPTIME_MS;
  const connectTimeoutMs = reconnectOpts.connectTimeoutMs;
  const signal = options?.signal;
  const hooks = options?.hooks;
  const limits = options?.limits;
  const queueOpts = options?.queue;
  const retryPolicy = options?.retryPolicy;
  const messageHelpers = options?.message;
  const protocols = options?.protocols;
  const autoConnect = options?.autoConnect !== false;

  const state: ReconnectingWebSocketState = {
    status: WS_RECONNECT_STATUS.IDLE as ReconnectingWebSocketStatus,
    lastError: null,
    lastOpenAt: null,
    lastCloseAt: null,
    attemptCount: 0,
    reconnectAttempt: 0,
    queuedCount: 0,
  };

  let ws: WebSocket | undefined;
  let reconnectAttempt = 0;
  let lastDelayMs = 0;
  let outageStartedAt: number | null = null;
  let heartbeatRunner: ReturnType<typeof runHeartbeat> | null = null;
  let closed = false;
  let manualReconnect = false;
  let reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  let idleTimerId: ReturnType<typeof setTimeout> | null = null;
  let maxUptimeTimerId: ReturnType<typeof setTimeout> | null = null;
  let uptimeResetTimerId: ReturnType<typeof setTimeout> | null = null;
  let connectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const messageQueue: MessageQueue | null =
    queueOpts?.enabled === true ? createMessageQueue(queueOpts) : null;

  function setStatus(s: ReconnectingWebSocketStatus): void {
    state.status = s;
  }

  function onAbort(): void {
    // Mirror fetch semantics: aborting the signal tears the whole thing down.
    doClose();
  }
  if (signal) {
    if (signal.aborted) closed = true;
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  function clearReconnectTimer(): void {
    if (reconnectTimerId !== null) {
      clearTimeout(reconnectTimerId);
      reconnectTimerId = null;
    }
  }

  function clearConnectTimeout(): void {
    if (connectTimeoutId !== null) {
      clearTimeout(connectTimeoutId);
      connectTimeoutId = null;
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
    if (uptimeResetTimerId !== null) {
      clearTimeout(uptimeResetTimerId);
      uptimeResetTimerId = null;
    }
  }

  function computeDelay(): number {
    if (jitter === JITTER_MODE_DECORRELATED) {
      lastDelayMs = decorrelatedJitter(lastDelayMs || initialDelayMs, initialDelayMs, maxDelayMs);
      return Math.max(1, lastDelayMs);
    }
    const base = computeReconnectDelay(
      reconnectAttempt,
      initialDelayMs,
      maxDelayMs,
      backoffMultiplier,
    );
    return Math.max(1, applyJitter(base, jitter, jitterRatio));
  }

  function scheduleReconnect(): void {
    clearReconnectTimer();
    if (closed || signal?.aborted) return;
    // maxElapsedMs bounds the CURRENT outage (time since this reconnect
    // sequence began), not the lifetime of the socket. Measuring from the
    // first-ever connect would permanently disable reconnection on any
    // connection that outlives the window.
    const elapsed = outageStartedAt !== null ? Date.now() - outageStartedAt : 0;
    if (retryPolicy?.maxElapsedMs !== undefined && elapsed >= retryPolicy.maxElapsedMs) return;
    const jittered = computeDelay();
    hooks?.onReconnect?.(reconnectAttempt, jittered);
    reconnectTimerId = setTimeout(() => {
      reconnectTimerId = null;
      connect();
    }, jittered);
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

  function startUptimeResetTimer(): void {
    if (uptimeResetTimerId) clearTimeout(uptimeResetTimerId);
    // Reset the attempt counter only after the connection proves stable.
    // Resetting immediately on open would let a flapping server (accepts
    // then instantly drops) defeat backoff and maxAttempts entirely.
    uptimeResetTimerId = setTimeout(() => {
      uptimeResetTimerId = null;
      reconnectAttempt = 0;
      lastDelayMs = 0;
      state.reconnectAttempt = 0;
    }, minUptimeMs);
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

  function attachHandlers(socket: WebSocket): void {
    // Every handler ignores events from sockets that have been replaced.
    // Without this guard a late close/error from a previous socket (e.g. a
    // server-side close racing a manual reconnect) mutates shared state and
    // can schedule a second reconnect loop -> two live connections.
    socket.onopen = (ev) => {
      if (socket !== ws) return;
      clearConnectTimeout();
      setStatus(WS_RECONNECT_STATUS.OPEN);
      state.lastOpenAt = Date.now();
      state.lastError = null;
      outageStartedAt = null;
      clearIdleAndUptime();
      startIdleTimer();
      startMaxUptimeTimer();
      startUptimeResetTimer();
      const hb = options?.heartbeat;
      if (hb) startHeartbeat(hb);
      flushQueue();
      hooks?.onOpen?.(ev);
    };

    socket.onmessage = (ev) => {
      if (socket !== ws) return;
      startIdleTimer();
      const hb = options?.heartbeat;
      if (hb?.expectPong && (hb.isPong ?? defaultIsPong)(ev.data)) {
        heartbeatRunner?.clearPongTimeout();
        heartbeatRunner?.resetMisses();
      }
      hooks?.onMessage?.(ev);
    };

    socket.onclose = (ev) => {
      if (socket !== ws) return;
      clearConnectTimeout();
      setStatus(WS_RECONNECT_STATUS.CLOSED);
      state.lastCloseAt = Date.now();
      state.reconnectAttempt = reconnectAttempt;
      clearHeartbeat();
      clearReconnectTimer();
      clearIdleAndUptime();
      hooks?.onClose?.(ev);

      if (closed) return;

      if (manualReconnect) {
        manualReconnect = false;
        connect();
        return;
      }

      const should =
        retryPolicy?.shouldReconnect?.({ attempt: reconnectAttempt, closeEvent: ev }) ?? true;
      if (!should || reconnectAttempt >= maxAttempts) return;

      if (outageStartedAt === null) outageStartedAt = Date.now();
      setStatus(WS_RECONNECT_STATUS.RECONNECTING);
      reconnectAttempt++;
      scheduleReconnect();
    };

    socket.onerror = (ev) => {
      if (socket !== ws) return;
      state.lastError = new Error(ERROR_WS_GENERIC);
      hooks?.onError?.(ev);
    };
  }

  function openSocket(target: string): void {
    setStatus(WS_RECONNECT_STATUS.CONNECTING);
    state.attemptCount++;
    const socket =
      protocols !== undefined ? new WebSocketCtor(target, protocols) : new WebSocketCtor(target);
    ws = socket;
    attachHandlers(socket);
    if (connectTimeoutMs !== undefined) {
      clearConnectTimeout();
      connectTimeoutId = setTimeout(() => {
        connectTimeoutId = null;
        if (socket === ws && socket.readyState === WS_READY_STATE.CONNECTING) {
          // Abort the stuck attempt; onclose drives the retry.
          socket.close();
        }
      }, connectTimeoutMs);
    }
  }

  function connect(): void {
    if (closed || signal?.aborted) return;
    if (typeof url === "string") {
      openSocket(url);
      return;
    }
    // URL provider (sync or async): resolved before every attempt so
    // refreshed auth tokens make it into the reconnect URL.
    let provided: string | Promise<string>;
    try {
      provided = url();
    } catch (err) {
      handleProviderFailure(err);
      return;
    }
    if (typeof provided === "string") {
      openSocket(provided);
      return;
    }
    setStatus(WS_RECONNECT_STATUS.CONNECTING);
    provided.then(
      (resolved) => {
        if (closed || signal?.aborted) return;
        openSocket(resolved);
      },
      (err) => handleProviderFailure(err),
    );
  }

  function handleProviderFailure(err: unknown): void {
    state.lastError = err instanceof Error ? err : new Error(String(err));
    if (closed || reconnectAttempt >= maxAttempts) {
      setStatus(WS_RECONNECT_STATUS.CLOSED);
      return;
    }
    if (outageStartedAt === null) outageStartedAt = Date.now();
    setStatus(WS_RECONNECT_STATUS.RECONNECTING);
    reconnectAttempt++;
    state.reconnectAttempt = reconnectAttempt;
    scheduleReconnect();
  }

  function send(data: string | unknown): boolean {
    const serialized =
      typeof data === "string"
        ? data
        : messageHelpers?.serialize
          ? messageHelpers.serialize(data)
          : JSON.stringify(data);

    if (ws?.readyState === WS_READY_STATE.OPEN) {
      ws.send(serialized);
      return true;
    }
    if (messageQueue) {
      messageQueue.push(serialized);
      return true;
    }
    return false;
  }

  function open(): void {
    if (state.status !== WS_RECONNECT_STATUS.IDLE) return;
    connect();
  }

  function doClose(code?: number, reason?: string): void {
    closed = true;
    manualReconnect = false;
    clearReconnectTimer();
    clearConnectTimeout();
    clearHeartbeat();
    clearIdleAndUptime();
    if (signal) signal.removeEventListener("abort", onAbort);
    if (
      ws !== undefined &&
      ws.readyState !== WS_READY_STATE.CLOSED &&
      ws.readyState !== WS_READY_STATE.CLOSING
    ) {
      setStatus(WS_RECONNECT_STATUS.CLOSING);
      if (code !== undefined) ws.close(code, reason);
      else ws.close();
    }
  }

  if (autoConnect) connect();
  else setStatus(WS_RECONNECT_STATUS.IDLE);

  return {
    get ws(): WebSocket | undefined {
      return ws;
    },
    reconnect() {
      if (signal?.aborted) return;
      closed = false;
      reconnectAttempt = 0;
      lastDelayMs = 0;
      outageStartedAt = null;
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
    close: doClose,
    open,
    getState: () => ({ ...state, queuedCount: messageQueue?.length() ?? 0 }),
    send,
  };
}
