import { useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:3000";
const MAX_RECONNECT_DELAY = 30000;

/**
 * useWebSocket — connects to WS server with JWT auth, auto-reconnects
 * @param {Function} onMessage - called with parsed payload on every message
 * @param {boolean} enabled - whether to connect (e.g. only when logged in)
 */
export default function useWebSocket(onMessage, enabled = true) {
  const wsRef = useRef(null);
  const reconnectDelay = useRef(1000);
  const reconnectTimer = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep the callback reference fresh without triggering reconnects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      reconnectDelay.current = 1000; // reset backoff on success
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onMessageRef.current) onMessageRef.current(payload);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket closed:", event.code);
      if (event.code !== 1000) {
        // Abnormal close — reconnect with exponential backoff
        scheduleReconnect();
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
      ws.close();
    };
  }, [enabled]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    const delay = Math.min(reconnectDelay.current, MAX_RECONNECT_DELAY);
    console.log(`🔄 WS reconnecting in ${delay}ms...`);
    reconnectTimer.current = setTimeout(() => {
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [enabled, connect]);
}
