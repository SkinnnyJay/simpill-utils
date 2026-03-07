## Install

<p align="center">
  [![npm version](https://img.shields.io/npm/v/@simpill%2fsocket.utils.svg)](https://www.npmjs.com/package/@simpill/socket.utils)
  [![GitHub](https://img.shields.io/badge/GitHub-source-blue?logo=github)](https://github.com/SkinnnyJay/simpill-utils/tree/main/utils/@simpill-socket.utils)
</p>

**npm**
```bash
npm install @simpill/socket.utils
```

**GitHub** (from monorepo)
```bash
git clone https://github.com/SkinnnyJay/simpill-utils.git && cd simpill-utils/utils/@simpill-socket.utils && npm install && npm run build
```
Then in your project: `npm install /path/to/simpill-utils/utils/@simpill-socket.utils` or `npm link` from that directory.

---

## Usage

```ts
import { createReconnectingWebSocket } from "@simpill/socket.utils";

const { ws, reconnect, close } = createReconnectingWebSocket("wss://example.com", {
  reconnect: {
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 1.5,
  },
  heartbeat: { intervalMs: 30000, message: "ping" },
});

ws.onmessage = (e) => console.log(e.data);
reconnect(); // manual reconnect
close(); // stop reconnecting and close
```

## API

- **createReconnectingWebSocket(url, options?)** — Returns **{ ws, reconnect(), close(), open(), getState(), send(data) }**. Options: **reconnect**, **heartbeat**, **WebSocketCtor**, **signal**, **autoConnect**, **hooks**, **limits**, **queue**, **retryPolicy**, **message**.
- **ReconnectOptions, HeartbeatOptions, ReconnectingWebSocketHooks, MessageQueueOptions, RetryPolicyOptions, MessageHelpersOptions, ReconnectingWebSocketState** — Shared types.

### Reconnect options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **maxAttempts** | number | 10 | Stop reconnecting after this many attempts. |
| **initialDelayMs** | number | 1000 | Delay before first reconnect. |
| **maxDelayMs** | number | 30000 | Cap on delay between attempts. |
| **backoffMultiplier** | number | 1.5 | Multiply delay by this after each attempt. |
| **jitter** | "none" \| "full" \| "equal" | "none" | Apply jitter to delay to avoid thundering herd. |
| **jitterRatio** | number (0–1) | 0.5 | Used when jitter is "equal" for min/max range. |

Use **retryPolicy.maxElapsedMs** and **retryPolicy.shouldReconnect** to cap by time or close event.

### Heartbeat options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **intervalMs** | number | (required) | Send ping at this interval while open. |
| **message** | string \| () => string | "" | Ping payload; empty string skips send. |
| **timeoutMs** | number | — | Optional; when expectPong, **pongTimeoutMs** is used for pong wait. |
| **expectPong** | boolean | false | When true, expect pong and close after maxMisses without pong. |
| **pongTimeoutMs** | number | 5000 | Time to wait for pong before counting a miss. |
| **maxMisses** | number | 3 | Close and reconnect after this many missed pongs. |
| **isPong** | (data: unknown) => boolean | string "pong" or { type: "pong" } | Detects pong in incoming message. |

### Send queue and backpressure

When **queue.enabled** is true, **send(data)** while the socket is not **open** pushes messages into an outbound queue. When the socket opens, the queue is flushed (oldest first). **queue.maxSize** caps the queue; exceeding it drops the oldest messages and calls **queue.onDrop(count)**. **queue.ttlMs** drops messages older than that when flushing. There is **no** backpressure API (e.g. callback when send is safe); use **getState().status === "open"** or **queue.onDrop** to react.

### Typed message codecs

**message.serialize(value)** is used when you call **send(non-string)**; default is **JSON.stringify**. **message.parse** and **message.validate** are **not** applied by the library—use them in **hooks.onMessage** to parse and validate incoming data (e.g. **const parsed = message.parse(ev.data); if (message.validate?.(parsed)) { ... }**).

### Heartbeat semantics

**heartbeat.intervalMs** and **heartbeat.message** (string or function) send a ping on that interval while **open**. If **heartbeat.expectPong** is true, the client expects a pong reply; **heartbeat.isPong(data)** (default: string `"pong"` or object `{ type: "pong" }`) detects it. If no pong is received within **heartbeat.pongTimeoutMs** (default 5000), a “miss” is counted; after **heartbeat.maxMisses** (default 3) the socket is closed so reconnect can run. So heartbeat both keeps the connection alive and can detect dead connections when the server stops replying.

### Backoff jitter

**reconnect.jitter** can be **"none"** (no jitter), **"full"** (delay = random 0..delayMs), or **"equal"** (delay in [delayMs*(1-ratio), delayMs*(1+ratio)]). **reconnect.jitterRatio** (0–1, default 0.5) is used for **"equal"** only. Jitter is applied to the delay **before** each reconnect attempt to avoid thundering herd.

### Hooks and events

**options.hooks** can set:

| Hook | When |
|------|------|
| **onOpen** | Socket opened (after connect). |
| **onClose** | Socket closed (before reconnect scheduled if any). |
| **onReconnect** | Reconnect scheduled (attempt number and delayMs). |
| **onMessage** | Any message received (use for parse/validate if desired). |
| **onError** | WebSocket error event. |

You can also attach **ws.onopen**, **ws.onmessage**, etc.; hooks are in addition to that.

### Server helpers

This package provides a **reconnecting client** only. There are **no** WebSocket server helpers; use **ws**, **uWebSockets.js**, or your runtime’s server API.

### WebSocketCtor (browser vs Node)

In the **browser**, **globalThis.WebSocket** is used by default. In **Node**, there is no built-in WebSocket; pass **WebSocketCtor** from **ws** (or another compatible constructor). The constructor must support **new WebSocketCtor(url)** and the same **readyState**, **send**, **close**, and event (onopen, onclose, onmessage, onerror) contract. Small API differences (e.g. binary type, protocol list) depend on the implementation.

### close() semantics

**close()** sets an internal **closed** flag, clears reconnect and heartbeat timers, and closes the underlying **ws** if it is not already **CLOSED** or **CLOSING**. After **close()**, no further reconnects occur. **reconnect()** clears **closed** and resets the attempt count so the client can connect again. Calling **close()** multiple times is safe.

### Node.js with `ws` example

```ts
import WebSocket from "ws";
import { createReconnectingWebSocket } from "@simpill/socket.utils";

const { ws, close } = createReconnectingWebSocket("wss://example.com", {
  WebSocketCtor: WebSocket as typeof globalThis.WebSocket,
  reconnect: { maxAttempts: 5, initialDelayMs: 1000 },
});
ws?.on("open", () => console.log("open"));
// In Node, ws may use .on("message", ...) depending on version; check ws docs.
close();
```

### Retry cap guidance

Reconnects are limited by **reconnect.maxAttempts** (default 10) and optionally by **retryPolicy.maxElapsedMs** (stop after total time since first connect) and **retryPolicy.shouldReconnect({ attempt, closeEvent })** (return false to stop). For “infinite” retries use a high **maxAttempts** and/or omit **maxElapsedMs** and **shouldReconnect**; cap by time or close code in **shouldReconnect** to avoid endless reconnect loops (e.g. 401/403 or server “go away” close code).

### What we don't provide

- **Server helpers** — Reconnecting **client** only; for WebSocket server use **ws**, **uWebSockets.js**, or your runtime’s server API.
- **Backpressure** — No callback when send is “safe”; use **getState().status === "open"** or **queue.onDrop** to react.
- **Message parse/validate** — **message.serialize** is used for **send**; use **hooks.onMessage** and your own **message.parse** / **message.validate** for incoming data.

### When to use

| Use case | Recommendation |
|----------|----------------|
| Browser or Node WebSocket client with auto-reconnect | Use **createReconnectingWebSocket** with **WebSocketCtor** in Node. |
| Keep connection alive / detect dead server | Use **heartbeat** with **expectPong** and **maxMisses**. |
| Send before open / avoid drops | Enable **queue** with **maxSize** and **onDrop** to handle overflow. |
| Custom backoff / stop after time | Use **retryPolicy.shouldReconnect** and **maxElapsedMs**. |
| Observability | Use **hooks** and **getState()** for logging and metrics. |

Subpaths: `@simpill/socket.utils`, `./client`, `./server` (types), `./shared`.

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | createReconnectingWebSocket, reconnect options, heartbeat, close |

---

## Contributing

- [CONTRIBUTING](../../CONTRIBUTING.md) — Monorepo package guide.

---

## License

ISC
