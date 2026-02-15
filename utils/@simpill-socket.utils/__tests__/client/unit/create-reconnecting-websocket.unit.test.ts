import { delay } from "@simpill/async.utils";
import { createReconnectingWebSocket } from "../../../src/client/create-reconnecting-websocket";

describe("createReconnectingWebSocket", () => {
  function makeMockWebSocketCtor(): {
    instances: Array<{
      readyState: number;
      onclose: (() => void) | null;
      onopen: ((ev?: Event) => void) | null;
      onmessage: ((ev: MessageEvent) => void) | null;
      onerror: ((ev: Event) => void) | null;
      send: ReturnType<typeof jest.fn>;
      close: ReturnType<typeof jest.fn>;
    }>;
    Ctor: typeof WebSocket;
  } {
    const instances: Array<{
      readyState: number;
      onclose: (() => void) | null;
      onopen: ((ev?: Event) => void) | null;
      onmessage: ((ev: MessageEvent) => void) | null;
      onerror: ((ev: Event) => void) | null;
      send: ReturnType<typeof jest.fn>;
      close: ReturnType<typeof jest.fn>;
    }> = [];
    const Ctor = jest.fn().mockImplementation(function (this: (typeof instances)[0]) {
      this.readyState = 0;
      this.onclose = null;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.send = jest.fn();
      this.close = jest.fn().mockImplementation(() => {
        this.readyState = 3;
        if (this.onclose) this.onclose();
      });
      instances.push(this);
      return this;
    }) as unknown as typeof WebSocket;
    return { instances, Ctor };
  }

  it("throws when WebSocket is not available and WebSocketCtor not provided", () => {
    const orig = globalThis.WebSocket;
    try {
      (globalThis as { WebSocket?: typeof globalThis.WebSocket }).WebSocket = undefined;
      expect(() => createReconnectingWebSocket("ws://example.com")).toThrow(
        "WebSocket is not available",
      );
    } finally {
      (globalThis as { WebSocket?: typeof globalThis.WebSocket }).WebSocket = orig;
    }
  });

  it("creates ws and returns reconnect and close", () => {
    const { Ctor } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
    });
    expect(result.ws).toBeDefined();
    expect(result.reconnect).toBeDefined();
    expect(typeof result.close).toBe("function");
  });

  it("calls close on ws when close() is invoked", () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
    });
    result.close();
    expect(instances[0].close).toHaveBeenCalled();
  });

  it("starts heartbeat when heartbeat option is provided", async () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      heartbeat: { intervalMs: 50, message: "ping" },
    });
    const ws = instances[0];
    ws.readyState = 1; // OPEN
    ws.onopen?.();
    await delay(100);
    expect(ws.send).toHaveBeenCalledWith("ping");
    result.close();
  });

  it("reconnect() resets and connects again", async () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 2, initialDelayMs: 1 },
    });
    expect(instances.length).toBe(1);
    instances[0].readyState = 1;
    result.reconnect();
    expect(instances.length).toBe(2);
    await delay(5);
    expect(instances.length).toBe(2);
    result.close();
  });

  it("close() prevents reconnect on onclose", async () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 5, initialDelayMs: 10 },
    });
    result.close();
    instances[0].onclose?.();
    await delay(30);
    expect(instances.length).toBe(1);
  });

  it("getState() returns status and attemptCount", () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
    });
    const s = result.getState();
    expect(s.attemptCount).toBe(1);
    expect(["connecting", "open"]).toContain(s.status);
    instances[0].readyState = 1;
    instances[0].onopen?.();
    const s2 = result.getState();
    expect(s2.status).toBe("open");
    expect(s2.lastOpenAt).toBeDefined();
    result.close();
  });

  it("hooks onOpen and onClose are called", () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      hooks: { onOpen, onClose },
    });
    instances[0].readyState = 1;
    instances[0].onopen?.();
    expect(onOpen).toHaveBeenCalled();
    result.close();
    instances[0].onclose?.();
    expect(onClose).toHaveBeenCalled();
  });

  it("manual open() when autoConnect false", () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      autoConnect: false,
    });
    expect(result.ws).toBeUndefined();
    expect(result.getState().status).toBe("idle");
    result.open();
    expect(instances.length).toBe(1);
    expect(result.ws).toBe(instances[0]);
    result.close();
  });

  it("send() with queue flushes on open", () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      queue: { enabled: true },
    });
    result.send("a");
    result.send("b");
    const ws = instances[0];
    ws.readyState = 1;
    ws.onopen?.();
    expect(ws.send).toHaveBeenCalledWith("a");
    expect(ws.send).toHaveBeenCalledWith("b");
    result.close();
  });

  it("retryPolicy shouldReconnect false stops reconnect", async () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 5, initialDelayMs: 5 },
      retryPolicy: { shouldReconnect: () => false },
    });
    instances[0].onclose?.();
    await delay(50);
    expect(instances.length).toBe(1);
    result.close();
  });

  it("reconnect with jitter runs without throwing", async () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 2, initialDelayMs: 5, jitter: "equal", jitterRatio: 0.2 },
    });
    instances[0].onclose?.();
    await delay(30);
    expect(instances.length).toBeGreaterThanOrEqual(1);
    result.close();
  });

  it("limits.idleMs closes socket after idle", async () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockWebSocketCtor();
    createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      limits: { idleMs: 100 },
    });
    instances[0].readyState = 1;
    instances[0].onopen?.();
    jest.advanceTimersByTime(150);
    expect(instances[0].close).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("heartbeat expectPong resets misses on pong", async () => {
    const { Ctor, instances } = makeMockWebSocketCtor();
    const result = createReconnectingWebSocket("ws://example.com", {
      WebSocketCtor: Ctor,
      heartbeat: {
        intervalMs: 20,
        message: "ping",
        expectPong: true,
        pongTimeoutMs: 50,
        maxMisses: 2,
        isPong: (d) => d === "pong",
      },
    });
    const ws = instances[0];
    ws.readyState = 1;
    ws.onopen?.();
    await delay(30);
    ws.onmessage?.({ data: "pong" } as MessageEvent);
    await delay(80);
    expect(ws.close).not.toHaveBeenCalled();
    result.close();
  });
});
