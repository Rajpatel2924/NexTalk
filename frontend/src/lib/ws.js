import { BACKEND_URL } from "@/lib/api";

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
    // start ping
    socket._ping = setInterval(() => {
      if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
  };

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      listeners.forEach((cb) => cb(data));
    } catch (_) { /* ignore parse errors */ }
  };

  socket.onclose = () => {
    if (socket?._ping) clearInterval(socket._ping);
    socket = null;
    // attempt reconnect
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connectWS(token), 2500);
  };

  socket.onerror = () => {
    try { socket.close(); } catch (_) { /* ignore */ }
  };
}

export function disconnectWS() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) {
    if (socket._ping) clearInterval(socket._ping);
    try { socket.close(); } catch (_) { /* ignore close errors */ }
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
