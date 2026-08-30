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
    this.token = null;

    // Detection & Fallback
    this.useSharedWorker = typeof window !== "undefined" && !!window.SharedWorker;
    this.worker = null;
    this.localWs = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;

    // Start Worker Heartbeat
    if (this.useSharedWorker) {
      this.startHeartbeat();
    }

    // Window event listeners to handle reconnection
    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        if (!this.isConnected && !this.isConnecting && localStorage.getItem("access_token")) {
          console.log("[WS Client] Window focused, ensuring connection is active...");
          this.connect();
        }
      });
      window.addEventListener("online", () => {
        if (!this.isConnected && !this.isConnecting && localStorage.getItem("access_token")) {
          console.log("[WS Client] Network online, ensuring connection is active...");
          this.connect();
        }
      });
      window.addEventListener("beforeunload", () => {
        this.notifyTabClosing();
      });
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.worker && this.isConnected) {
        try {
          this.worker.port.postMessage({ type: "HEARTBEAT" });
        } catch (e) {
          console.warn("[WS Client] Heartbeat send failed:", e);
        }
      }
    }, 5000);
  }

  notifyTabClosing() {
    if (this.worker) {
      try {
        this.worker.port.postMessage({ type: "PORT_CLOSE" });
      } catch (e) {}
    }
  }

  initSharedWorker() {
    try {
      console.log("[WS Client] Initializing SharedWorker...");
      // Vite bundles workers correctly using URL imports
      const workerUrl = new URL("./wsWorker.js", import.meta.url);
      this.worker = new SharedWorker(workerUrl, { type: "module" });
      this.worker.port.start();

      this.worker.port.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        switch (data.type) {
          case "OPEN":
            console.log("[WS Client] Connection established via SharedWorker");
            this.isConnected = true;
            this.isConnecting = false;
            this.emit("open");
            this.flushQueue();
            break;

          case "MESSAGE":
            const payload = data.payload;
            if (payload.event === "notification") {
              console.log("[WS Client] Received notification payload:", payload);
            }
            if (payload.event) {
              this.emit(payload.event, payload);
            }
            this.emit("*", payload);
            break;

          case "CLOSE":
            console.log("[WS Client] SharedWorker closed connection:", data.code, data.reason);
            this.isConnected = false;
            this.isConnecting = false;
            this.emit("close", data);
            break;

          case "ERROR":
            console.error("[WS Client] SharedWorker connection error:", data.error);
            this.emit("error", data.error);
            break;

          case "HEARTBEAT_ACK":
            // Received reply for keep-alive
            break;
        }
      };
    } catch (err) {
      console.warn("[WS Client] SharedWorker init failed, falling back to local connection.", err);
      this.useSharedWorker = false;
      this.initLocalFallback();
    }
  }

  initLocalFallback() {
    console.log("[WS Client] Initializing direct local WebSocket...");
  }

  async connect() {
    let token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("[WS Client] Cannot connect: missing access_token");
      return;
    }

    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    // Ensure valid token before connecting
    try {
      const freshToken = await ensureValidAccessToken();
      if (freshToken) {
        token = freshToken;
      }
    } catch (err) {
      console.warn("[WS Client] Token verification/refresh error:", err);
    }

    const wsUrl = getWsUrl();

    if (this.useSharedWorker) {
      if (!this.worker) {
        this.initSharedWorker();
      }
      if (this.worker) {
        this.worker.port.postMessage({
          type: "CONNECT",
          token: token,
          wsUrl: wsUrl,
        });
      }
    } else {
      this.connectLocal(token, wsUrl);
    }
  }

  connectLocal(token, wsUrl) {
    if (this.localWs && (this.localWs.readyState === WebSocket.OPEN || this.localWs.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = `${wsUrl}/ws?token=${encodeURIComponent(token)}`;
    console.log("[WS Client] Connecting local WS to:", url);

    this.localWs = new WebSocket(url);

    this.localWs.onopen = () => {
      console.log("[WS Client] Local WebSocket connection established");
      this.isConnected = true;
      this.isConnecting = false;
      this.emit("open");
      this.flushQueue();
    };

    this.localWs.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "notification") {
          console.log("[WS Client] Received notification payload:", payload);
        }
        if (payload.event) {
          this.emit(payload.event, payload);
        }
        this.emit("*", payload);
      } catch (err) {
        console.error("[WS Client] Local WS parsing error:", err);
      }
    };

    this.localWs.onerror = (error) => {
      console.error("[WS Client] Local WS error:", error);
      this.emit("error", error);
    };

    this.localWs.onclose = (e) => {
      console.log("[WS Client] Local WS closed:", e.code, e.reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit("close", e);

      if (e.code !== 1000) {
        this.scheduleLocalReconnect();
      }
    };
  }

  scheduleLocalReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log("[WS Client] Reconnecting local WS...");
      this.connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.useSharedWorker && this.worker) {
      this.worker.port.postMessage({ type: "DISCONNECT" });
    } else if (this.localWs) {
      this.localWs.close(1000, "User logged out");
      this.localWs = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.pendingQueue = [];
  }

  send(data) {
    if (this.isConnected) {
      if (this.useSharedWorker && this.worker) {
        this.worker.port.postMessage({
          type: "SEND",
          payload: data,
        });
        return true;
      } else if (this.localWs && this.localWs.readyState === WebSocket.OPEN) {
        this.localWs.send(JSON.stringify(data));
        return true;
      }
    }

    // Queue outgoing messages if connection is not ready
    this.pendingQueue.push(data);
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
          console.error(`[WS Client] Error in listener for '${event}':`, err);
        }
      });
    }
  }
}

export const wsClient = new WebSocketClient();
