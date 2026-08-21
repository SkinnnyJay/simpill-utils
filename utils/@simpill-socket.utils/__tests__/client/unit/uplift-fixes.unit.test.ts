import { createReconnectingWebSocket } from "../../../src/client/create-reconnecting-websocket";
import { createMessageQueue } from "../../../src/client/message-queue";

type MockWs = {
  url: string;
  protocols?: string | string[];
  readyState: number;
  onclose: ((ev?: CloseEvent) => void) | null;
  onopen: ((ev?: Event) => void) | null;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  send: ReturnType<typeof jest.fn>;
  close: ReturnType<typeof jest.fn>;
};

function makeMockCtor(): { instances: MockWs[]; Ctor: typeof WebSocket } {
  const instances: MockWs[] = [];
  const Ctor = jest.fn().mockImplementation(function (
    this: MockWs,
    url: string,
    protocols?: string | string[],
  ) {
    this.url = url;
    this.protocols = protocols;
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

describe("heartbeat pong-timeout math (dead-connection detection)", () => {
  it("detects a dead connection when intervalMs < pongTimeoutMs (old code never fired)", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 0 },
      // interval 1s, pong timeout 5s: previous impl cleared and re-armed the
      // pong timeout on EVERY ping, so the 5s deadline could never elapse.
      heartbeat: {
        intervalMs: 1000,
        message: "ping",
        expectPong: true,
        pongTimeoutMs: 5000,
        maxMisses: 1,
      },
    });
    const ws = instances[0];
    ws.readyState = 1;
    ws.onopen?.();
    // Server is dead: never answers. 10 pings elapse (10s) > pongTimeout 5s.
    jest.advanceTimersByTime(10_000);
    expect(ws.close).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("does not close a healthy connection that answers pongs", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 0 },
      heartbeat: {
        intervalMs: 1000,
        message: "ping",
        expectPong: true,
        pongTimeoutMs: 3000,
        maxMisses: 1,
      },
    });
    const ws = instances[0];
    ws.readyState = 1;
    ws.onopen?.();
    for (let i = 0; i < 10; i++) {
      jest.advanceTimersByTime(1000); // ping fires
      ws.onmessage?.({ data: "pong" } as MessageEvent); // prompt pong
    }
    expect(ws.close).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("honors the documented timeoutMs alias (was silently ignored)", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 0 },
      heartbeat: {
        intervalMs: 500,
        message: "ping",
        expectPong: true,
        timeoutMs: 1000,
        maxMisses: 1,
      },
    });
    const ws = instances[0];
    ws.readyState = 1;
    ws.onopen?.();
    jest.advanceTimersByTime(2000);
    expect(ws.close).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe("reconnect attempt counter resets after stable uptime", () => {
  it("a long-lived connection does not exhaust maxAttempts across separate outages", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 3, initialDelayMs: 10, minUptimeMs: 1000 },
    });
    // Simulate 5 separate outages, each recovered on the first retry after a
    // stable stretch. Old code never reset the counter -> permanently gave up
    // after the 3rd cumulative drop.
    for (let outage = 0; outage < 5; outage++) {
      const current = instances[instances.length - 1];
      current.readyState = 1;
      current.onopen?.();
      jest.advanceTimersByTime(2000); // stable > minUptimeMs -> counter resets
      current.readyState = 3;
      current.onclose?.(); // drop
      jest.advanceTimersByTime(50); // reconnect timer fires
    }
    // 1 initial + 5 reconnects: every outage got a retry.
    expect(instances.length).toBe(6);
    jest.useRealTimers();
  });

  it("a flapping connection (drops before minUptimeMs) still respects maxAttempts", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 3, initialDelayMs: 10, minUptimeMs: 5000 },
    });
    for (let i = 0; i < 10; i++) {
      const current = instances[instances.length - 1];
      current.readyState = 1;
      current.onopen?.();
      jest.advanceTimersByTime(100); // drops before proving stable
      current.readyState = 3;
      current.onclose?.();
      jest.advanceTimersByTime(200);
    }
    // 1 initial + at most maxAttempts reconnects.
    expect(instances.length).toBe(4);
    jest.useRealTimers();
  });
});

describe("retryPolicy.maxElapsedMs bounds the current outage, not the socket lifetime", () => {
  it("reconnects after an outage even when the connection outlived maxElapsedMs", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 5, initialDelayMs: 10 },
      retryPolicy: { maxElapsedMs: 60_000 },
    });
    const first = instances[0];
    first.readyState = 1;
    first.onopen?.();
    // Connection stays up for 10 minutes — far beyond maxElapsedMs. Old code
    // measured from the FIRST connect ever, so this drop got zero retries.
    jest.advanceTimersByTime(600_000);
    first.readyState = 3;
    first.onclose?.();
    jest.advanceTimersByTime(50);
    expect(instances.length).toBe(2);
    jest.useRealTimers();
  });
});

describe("stale-socket handler guard", () => {
  it("a late close event from a replaced socket does not spawn a parallel reconnect loop", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    const result = createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 10, initialDelayMs: 10 },
    });
    const oldSocket = instances[0];
    oldSocket.readyState = 1;
    oldSocket.onopen?.();
    // Drop -> reconnect scheduled -> new socket created.
    oldSocket.readyState = 3;
    oldSocket.onclose?.();
    jest.advanceTimersByTime(50);
    expect(instances.length).toBe(2);
    const current = instances[1];
    current.readyState = 1;
    current.onopen?.();
    expect(result.getState().status).toBe("open");
    // Server-side close of the OLD socket arrives late (race). Old code let
    // it flip status to closed and schedule ANOTHER reconnect -> two loops.
    oldSocket.onclose?.();
    expect(result.getState().status).toBe("open");
    jest.advanceTimersByTime(1000);
    expect(instances.length).toBe(2); // no third connection
    jest.useRealTimers();
  });
});

describe("message queue correctness", () => {
  it("maxSize: 0 rejects every push instead of growing unbounded", () => {
    const drops: number[] = [];
    const q = createMessageQueue({ maxSize: 0, onDrop: (n) => drops.push(n) });
    q.push("a");
    q.push("b");
    expect(q.length()).toBe(0); // old code: length grew to 2
    expect(drops).toEqual([1, 1]);
  });

  it("onDrop reports the exact number of evicted messages (old code overcounted)", () => {
    const drops: number[] = [];
    const q = createMessageQueue({ maxSize: 2, onDrop: (n) => drops.push(n) });
    q.push("a");
    q.push("b");
    q.push("c"); // evicts "a"
    expect(q.length()).toBe(2);
    expect(drops).toEqual([1]);
    const sent: string[] = [];
    q.flush((d) => sent.push(d));
    expect(sent).toEqual(["b", "c"]);
  });

  it("clear() empties the queue", () => {
    const q = createMessageQueue({});
    q.push("a");
    q.push("b");
    q.clear();
    expect(q.length()).toBe(0);
  });
});

describe("send() no longer drops silently", () => {
  it("returns false when socket is not open and queue is disabled", () => {
    const { Ctor, instances } = makeMockCtor();
    const result = createReconnectingWebSocket("ws://x", { WebSocketCtor: Ctor });
    // Still CONNECTING.
    expect(result.send("hello")).toBe(false);
    instances[0].readyState = 1;
    instances[0].onopen?.();
    expect(result.send("hello")).toBe(true);
    expect(instances[0].send).toHaveBeenCalledWith("hello");
  });

  it("returns true when queued, and getState exposes queuedCount", () => {
    const { Ctor, instances } = makeMockCtor();
    const result = createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      queue: { enabled: true },
    });
    expect(result.send("a")).toBe(true);
    expect(result.send("b")).toBe(true);
    expect(result.getState().queuedCount).toBe(2);
    instances[0].readyState = 1;
    instances[0].onopen?.();
    expect(result.getState().queuedCount).toBe(0);
    expect(instances[0].send).toHaveBeenCalledWith("a");
    expect(instances[0].send).toHaveBeenCalledWith("b");
  });
});

describe("AbortSignal semantics", () => {
  it("an already-aborted signal prevents connecting at all", () => {
    const { Ctor, instances } = makeMockCtor();
    const ac = new AbortController();
    ac.abort();
    createReconnectingWebSocket("ws://x", { WebSocketCtor: Ctor, signal: ac.signal });
    expect(instances.length).toBe(0); // old code connected anyway
  });

  it("aborting mid-flight closes the open socket and stops reconnects", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    const ac = new AbortController();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      signal: ac.signal,
      reconnect: { maxAttempts: 5, initialDelayMs: 10 },
    });
    instances[0].readyState = 1;
    instances[0].onopen?.();
    ac.abort(); // old code only cancelled a pending reconnect timer
    expect(instances[0].close).toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(instances.length).toBe(1);
    jest.useRealTimers();
  });
});

describe("new capabilities", () => {
  it("passes subprotocols to the WebSocket constructor", () => {
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      protocols: ["graphql-ws", "v2"],
    });
    expect(instances[0].protocols).toEqual(["graphql-ws", "v2"]);
  });

  it("close(code, reason) forwards to WebSocket#close", () => {
    const { Ctor, instances } = makeMockCtor();
    const result = createReconnectingWebSocket("ws://x", { WebSocketCtor: Ctor });
    result.close(4001, "going away");
    expect(instances[0].close).toHaveBeenCalledWith(4001, "going away");
  });

  it("url provider is called before every attempt (fresh tokens on reconnect)", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    let token = 0;
    createReconnectingWebSocket(() => `ws://x/?t=${++token}`, {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 3, initialDelayMs: 10 },
    });
    expect(instances[0].url).toBe("ws://x/?t=1");
    instances[0].readyState = 3;
    instances[0].onclose?.();
    jest.advanceTimersByTime(50);
    expect(instances[1].url).toBe("ws://x/?t=2");
    jest.useRealTimers();
  });

  it("async url provider resolves before connecting", async () => {
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket(async () => "ws://async-url", { WebSocketCtor: Ctor });
    expect(instances.length).toBe(0);
    await Promise.resolve(); // let the provider settle
    expect(instances.length).toBe(1);
    expect(instances[0].url).toBe("ws://async-url");
  });

  it("connectTimeoutMs aborts a stuck CONNECTING attempt and retries", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 3, initialDelayMs: 10, connectTimeoutMs: 2000 },
    });
    // Socket never leaves CONNECTING.
    jest.advanceTimersByTime(2500);
    expect(instances[0].close).toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(instances.length).toBe(2); // retry happened
    jest.useRealTimers();
  });

  it("decorrelated jitter produces delays within [initial, max] and reconnects", () => {
    jest.useFakeTimers();
    const { Ctor, instances } = makeMockCtor();
    const delays: number[] = [];
    createReconnectingWebSocket("ws://x", {
      WebSocketCtor: Ctor,
      reconnect: { maxAttempts: 5, initialDelayMs: 100, maxDelayMs: 1000, jitter: "decorrelated" },
      hooks: { onReconnect: (_a, d) => delays.push(d) },
    });
    for (let i = 0; i < 4; i++) {
      const current = instances[instances.length - 1];
      current.readyState = 3;
      current.onclose?.();
      jest.advanceTimersByTime(1100);
    }
    expect(delays.length).toBe(4);
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(100);
      expect(d).toBeLessThanOrEqual(1000);
    }
    jest.useRealTimers();
  });
});
