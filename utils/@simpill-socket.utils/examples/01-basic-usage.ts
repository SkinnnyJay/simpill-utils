/**
 * @simpill/socket.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { createReconnectingWebSocket } from "@simpill/socket.utils";

const { ws, close } = createReconnectingWebSocket("wss://echo.websocket.org", {
  reconnect: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5,
  },
  heartbeat: { intervalMs: 30_000, message: "ping" },
});

ws.onopen = () => {
  console.log("Connected");
  ws.send("Hello");
};

ws.onmessage = (e) => {
  console.log("Received:", e.data);
  close();
};

ws.onerror = (e) => console.error("WebSocket error:", e);
ws.onclose = () => console.log("Closed");

// Close after 3s if no message (avoids hanging)
setTimeout(() => {
  close();
}, 3000);
