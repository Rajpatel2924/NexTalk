import { BACKEND_URL } from "@/lib/api";

const PING_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 2_500;

let socket = null;
let listeners = new Set();
let reconnectTimer = null;

export function connectWS(token) {
  if (!token) return;
  disconnectWS();
  const wsProto = BACKEND_URL.startsWith("https") ? "wss" : "ws";
  const host = BACKEND_URL.replace(/^https?:\/\//, "");
  const url = `${wsProto}://${host}/api/ws?token=${encodeURIComponent(token)}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    socket._ping = setInterval(() => {
      if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, PING_INTERVAL_MS);
  };

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      listeners.forEach((cb) => cb(data));
    } catch (err) {
      console.warn("[ws] failed to parse message:", err);
    }
  };

  socket.onclose = () => {
    if (socket?._ping) clearInterval(socket._ping);
    socket = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connectWS(token), RECONNECT_DELAY_MS);
  };

  socket.onerror = (err) => {
    console.warn("[ws] error, will close socket:", err?.message || err);
    try { socket?.close(); } catch (e) { console.warn("[ws] close after error failed:", e); }
  };
}

export function disconnectWS() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) {
    if (socket._ping) clearInterval(socket._ping);
    try { socket.close(); } catch (err) { console.warn("[ws] close failed:", err); }
    socket = null;
  }
}

export function sendWS(payload) {
  if (socket && socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
  }
}

export function onWSMessage(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
