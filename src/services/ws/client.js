// Fieldchat WebSocket Client Service
// Support SharedWorker for sharing a single WebSocket connection across tabs,
// with automatic fallback to standard WebSocket in environments that don't support it.

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
    this.pendingQueue = [];
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectTimer = null;

    if (typeof window !== "undefined") {
      const handleAppResume = () => {
        if (!this.isConnected && !this.isConnecting) {
          console.log("[WS Client] App resumed / online, reconnecting WS...");
          this.connect();
        }
        this.handleFocus(true);
      };

      const handleAppBlur = () => {
        this.handleFocus(false);
      };

      window.addEventListener("focus", handleAppResume);
      window.addEventListener("blur", handleAppBlur);
      window.addEventListener("online", handleAppResume);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          handleAppResume();
        } else {
          handleAppBlur();
        }
      });
      window.addEventListener("beforeunload", () => {
        this.disconnect();
      });
    }
  }

  handleFocus(focused) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          event: focused ? "presence.focus" : "presence.unfocus",
        }));
      } catch (e) {}
    }
  }

  async connect() {
    let token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.isConnected = true;
        this.isConnecting = false;
      }
      return;
    }

    this.isConnecting = true;

    try {
      const freshToken = await ensureValidAccessToken();
      if (freshToken) {
        token = freshToken;
      }
    } catch (err) {
      console.warn("[WS Client] Token refresh error:", err);
    }

    const wsUrl = getWsUrl();
    const url = `${wsUrl}/ws?token=${encodeURIComponent(token)}`;
    console.log("[WS Client] Connecting WebSocket directly to:", url);

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error("[WS Client] Connection creation error:", err);
      this.isConnecting = false;
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log("[WS Client] Direct WebSocket connection established");
      this.isConnected = true;
      this.isConnecting = false;
      this.emit("open");
      this.flushQueue();

      const hasFocus = typeof document !== "undefined" && document.hasFocus ? document.hasFocus() : true;
      this.handleFocus(hasFocus);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event) {
          this.emit(payload.event, payload);
        }
        this.emit("*", payload);
      } catch (err) {
        console.error("[WS Client] WS parsing error:", err);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS Client] WebSocket error:", error);
      this.emit("error", error);
    };

    this.ws.onclose = (e) => {
      console.log("[WS Client] WebSocket closed:", e.code, e.reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit("close", e);

      if (e.code !== 1000) {
        this.scheduleReconnect();
      }
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log("[WS Client] Reconnecting WebSocket...");
      this.connect();
    }, 2500);
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
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.warn("[WS Client] ws.send failed:", err);
      }
    }

    // Queue outgoing transient events if connection is not ready.
    // Chat messages (message.created) are persisted and flushed via IndexedDB outbox.
    if (data?.event !== "message.created") {
      this.pendingQueue.push(data);
    }

    if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }
    return false;
  }

  flushQueue() {
    const queue = [...this.pendingQueue];
    this.pendingQueue = [];
    queue.forEach((msg) => this.send(msg));
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
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
          console.error(`[WS Client] Error in listener for '${event}':`, err);
        }
      });
    }
  }
}

export const wsClient = new WebSocketClient();
