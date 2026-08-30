// Fieldchat WebSocket Client Service

const getWsUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.BACKEND_API_URL;
  let baseUrl = "";
  if (envUrl) {
    baseUrl = envUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    if (!/^https?:\/\//i.test(baseUrl) && !/^wss?:\/\//i.test(baseUrl)) {
      baseUrl = "http://" + baseUrl;
    }
  } else if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    baseUrl = `${protocol}//${window.location.hostname}:8000`;
  } else {
    baseUrl = "http://localhost:8000";
  }
  if (/^https/i.test(baseUrl)) {
    return baseUrl.replace(/^https/i, "wss");
  }
  return baseUrl.replace(/^http/i, "ws");
};

import { ensureValidAccessToken } from "../api/request";

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // event -> Set of callbacks
    this.reconnectTimer = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.pendingQueue = [];

    // Reconnect immediately when window/tab is focused or network is restored
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        if (!this.isConnected && !this.isConnecting && localStorage.getItem("access_token")) {
          console.log("[WS] Window focused, ensuring connection is active...");
          this.connect();
        }
      });
      window.addEventListener("online", () => {
        if (!this.isConnected && !this.isConnecting && localStorage.getItem("access_token")) {
          console.log("[WS] Internet restored, reconnecting...");
          this.connect();
        }
      });
    }
  }

  async connect() {
    let token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("[WS] Cannot connect: missing access_token in localStorage");
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    // Refresh access token if expired before opening connection
    try {
      const freshToken = await ensureValidAccessToken();
      if (freshToken) {
        token = freshToken;
      }
    } catch (err) {
      console.warn("[WS] Failed to verify/refresh token before connecting:", err);
    }

    const wsBaseUrl = getWsUrl();
    const url = `${wsBaseUrl}/ws?token=${encodeURIComponent(token)}`;
    console.log("[WS] Connecting to", url);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] Connection established");
      this.isConnected = true;
      this.isConnecting = false;
      this.emit("open");

      // Flush outgoing message queue automatically on connect
      while (this.pendingQueue.length > 0) {
        const queued = this.pendingQueue.shift();
        try {
          this.ws.send(JSON.stringify(queued));
        } catch (err) {
          console.error("[WS] Error sending queued message:", err);
        }
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "notification") {
          console.log("[WS] Received notification payload:", payload);
        }
        if (payload.event) {
          this.emit(payload.event, payload);
        }
        this.emit("*", payload);
      } catch (err) {
        console.error("[WS] Error parsing message:", err);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error:", error);
      this.emit("error", error);
    };

    this.ws.onclose = (e) => {
      console.log("[WS] Connection closed:", e.code, e.reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit("close", e);

      // Auto-reconnect after 3 seconds on any non-clean disconnect
      if (e.code !== 1000) {
        this.scheduleReconnect();
      }
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log("[WS] Attempting to reconnect...");
      this.connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close(1000, "User logged out");
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.pendingQueue = [];
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      // Queue outgoing message/receipt so it is sent as soon as socket connects
      this.pendingQueue.push(data);
      if (!this.isConnected && !this.isConnecting) {
        this.connect();
      }
      return false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[WS] Error in event listener '${event}':`, err);
        }
      });
    }
  }
}

export const wsClient = new WebSocketClient();
