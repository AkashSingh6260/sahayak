import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { parse } from "url";

// Map of userId (string) → Set of WebSocket connections
const clients = new Map();

let wss = null;

/* ======================
   INIT WebSocket Server
   Call once with the http.Server instance
====================== */
export function initWSS(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws, req) => {
    // Parse JWT from query string: ws://localhost:3000?token=<jwt>
    const { query } = parse(req.url, true);
    const token = query.token;

    if (!token) {
      ws.close(1008, "Missing token");
      return;
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id.toString();
    } catch (err) {
      ws.close(1008, "Invalid token");
      return;
    }

    // Register connection in the Set for this user
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);
    console.log(`✅ WS connected: ${userId} (Total sockets: ${clients.get(userId).size})`);

    // Heartbeat — keep connection alive
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("close", () => {
      if (clients.has(userId)) {
        const userSockets = clients.get(userId);
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          clients.delete(userId);
          console.log(`❌ WS fully disconnected: ${userId}`);
        } else {
          console.log(`🔌 WS disconnected for ${userId} (Remaining: ${userSockets.size})`);
        }
      }
    });

    ws.on("error", (err) => {
      console.error(`WS error for ${userId}:`, err.message);
      if (clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
      }
    });
  });

  // Ping every 30s to keep connections alive and detect dead ones
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  console.log("🔌 WebSocket server initialized");
}

/* ======================
   NOTIFY A SPECIFIC USER
   payload: { type, message, data? }
====================== */
export function notifyUser(userId, payload) {
  if (!userId) return;

  const userIdStr = userId.toString();
  const userSockets = clients.get(userIdStr);

  if (userSockets && userSockets.size > 0) {
    const stringifiedPayload = JSON.stringify(payload);
    userSockets.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        try {
          ws.send(stringifiedPayload);
        } catch (err) {
          console.error(`WS send error to ${userIdStr}:`, err.message);
        }
      }
    });
    console.log(`📨 WS broadcasted to ${userIdStr} (${userSockets.size} sockets): ${payload.type}`);
  }
}

/* ======================
   NOTIFY MULTIPLE USERS
====================== */
export function notifyMany(userIds, payload) {
  userIds.forEach((id) => notifyUser(id, payload));
}

export { clients };
